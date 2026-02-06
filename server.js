require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'pixelforge-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

app.use(express.static('public'));

// --- Auth Middleware ---
function isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

function hasRole(roles) {
    return (req, res, next) => {
        if (req.session.user && roles.includes(req.session.user.role)) {
            return next();
        }
        res.status(403).json({ error: 'Forbidden' });
    };
}

// --- Routes ---

app.post('/api/login', async (req, res) => {
    const { username, password, token } = req.body;
    try {
        const user = await db.getAsync('SELECT * FROM users WHERE username = ?', [username]);

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.mfa_enabled) {
            if (!token) {
                return res.status(200).json({ mfa_required: true });
            }
            const verified = speakeasy.totp.verify({
                secret: user.mfa_secret,
                encoding: 'base32',
                token: token
            });
            if (!verified) {
                return res.status(401).json({ error: 'Invalid MFA token' });
            }
        }

        req.session.user = { id: user.id, username: user.username, role: user.role };
        res.json({ message: 'Login successful', user: req.session.user });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out' });
});

app.get('/api/me', async (req, res) => {
    if (req.session.user) {
        const user = await db.getAsync('SELECT id, username, role, mfa_enabled FROM users WHERE id = ?', [req.session.user.id]);
        res.json(user);
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

// Admin Only
app.post('/api/users', isAuthenticated, hasRole(['Admin']), async (req, res) => {
    const { username, password, role } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    try {
        await db.runAsync('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, role]);
        res.json({ message: 'User created' });
    } catch (err) {
        res.status(400).json({ error: 'Username already exists' });
    }
});

app.get('/api/users', isAuthenticated, hasRole(['Admin']), async (req, res) => {
    const users = await db.allAsync('SELECT id, username, role FROM users');
    res.json(users);
});

// Project Management
app.post('/api/projects', isAuthenticated, hasRole(['Admin']), async (req, res) => {
    const { name, description, deadline } = req.body;
    try {
        const result = await db.runAsync('INSERT INTO projects (name, description, deadline) VALUES (?, ?, ?)', [name, description, deadline]);
        res.json({ message: 'Project created', id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: 'Could not create project' });
    }
});

app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
        let projects;
        if (req.session.user.role === 'Admin') {
            projects = await db.allAsync('SELECT * FROM projects');
        } else {
            projects = await db.allAsync(`
        SELECT p.* FROM projects p
        JOIN project_assignments pa ON p.id = pa.project_id
        WHERE pa.user_id = ?
      `, [req.session.user.id]);
        }
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.patch('/api/projects/:id/complete', isAuthenticated, hasRole(['Admin']), async (req, res) => {
    await db.runAsync('UPDATE projects SET status = "Completed" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project completed' });
});

// Team Assignment
app.post('/api/projects/:id/assign', isAuthenticated, hasRole(['Admin', 'Project Lead']), async (req, res) => {
    const { user_id, role_in_project } = req.body;
    try {
        await db.runAsync('INSERT INTO project_assignments (project_id, user_id, role_in_project) VALUES (?, ?, ?)', [req.params.id, user_id, role_in_project]);
        res.json({ message: 'User assigned' });
    } catch (err) {
        res.status(400).json({ error: 'User already assigned or error' });
    }
});

app.get('/api/projects/:id/team', isAuthenticated, async (req, res) => {
    const team = await db.allAsync(`
    SELECT u.id, u.username, u.role, pa.role_in_project 
    FROM users u
    JOIN project_assignments pa ON u.id = pa.user_id
    WHERE pa.project_id = ?
  `, [req.params.id]);
    res.json(team);
});

// Document Management
app.post('/api/projects/:id/documents', isAuthenticated, hasRole(['Admin', 'Project Lead']), upload.single('document'), async (req, res) => {
    const { id } = req.params;
    await db.runAsync('INSERT INTO documents (project_id, filename, original_name, uploaded_by) VALUES (?, ?, ?, ?)',
        [id, req.file.filename, req.file.originalname, req.session.user.id]);
    res.json({ message: 'Document uploaded' });
});

app.get('/api/projects/:id/documents', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'Admin') {
        const assigned = await db.getAsync('SELECT 1 FROM project_assignments WHERE project_id = ? AND user_id = ?', [req.params.id, req.session.user.id]);
        if (!assigned) return res.status(403).json({ error: 'Access denied' });
    }
    const docs = await db.allAsync('SELECT * FROM documents WHERE project_id = ?', [req.params.id]);
    res.json(docs);
});

app.get('/api/documents/:id/download', isAuthenticated, async (req, res) => {
    const doc = await db.getAsync('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (req.session.user.role !== 'Admin') {
        const assigned = await db.getAsync('SELECT 1 FROM project_assignments WHERE project_id = ? AND user_id = ?', [doc.project_id, req.session.user.id]);
        if (!assigned) return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.join(__dirname, 'uploads', doc.filename);
    res.download(filePath, doc.original_name);
});

// MFA
app.post('/api/mfa/setup', isAuthenticated, async (req, res) => {
    const secret = speakeasy.generateSecret({ name: `PixelForge Nexus (${req.session.user.username})` });
    await db.runAsync('UPDATE users SET mfa_secret = ? WHERE id = ?', [secret.base32, req.session.user.id]);

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
        res.json({ qrcode: data_url, secret: secret.base32 });
    });
});

app.post('/api/mfa/verify', isAuthenticated, async (req, res) => {
    const { token } = req.body;
    const user = await db.getAsync('SELECT mfa_secret FROM users WHERE id = ?', [req.session.user.id]);

    const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: token
    });

    if (verified) {
        await db.runAsync('UPDATE users SET mfa_enabled = 1 WHERE id = ?', [req.session.user.id]);
        res.json({ message: 'MFA enabled' });
    } else {
        res.status(400).json({ error: 'Invalid token' });
    }
});

// Account Settings
app.post('/api/account/password', isAuthenticated, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await db.getAsync('SELECT * FROM users WHERE id = ?', [req.session.user.id]);

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
        return res.status(400).json({ error: 'Current password incorrect' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    await db.runAsync('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.session.user.id]);
    res.json({ message: 'Password updated' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`PixelForge Nexus running at http://localhost:${port}`);
});
