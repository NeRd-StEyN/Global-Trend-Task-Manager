const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'nexus.db');
const db = new sqlite3.Database(dbPath);

// Helper to run queries with promises
db.runAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

db.getAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

db.allAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Initialize tables
async function init() {
    await db.runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Admin', 'Project Lead', 'Developer')),
      mfa_secret TEXT,
      mfa_enabled INTEGER DEFAULT 0
    )
  `);

    await db.runAsync(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      deadline TEXT,
      status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Completed'))
    )
  `);

    await db.runAsync(`
    CREATE TABLE IF NOT EXISTS project_assignments (
      project_id INTEGER,
      user_id INTEGER,
      role_in_project TEXT,
      PRIMARY KEY (project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

    await db.runAsync(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      uploaded_by INTEGER,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

    // Pre-populate with an admin if not exists
    const admin = await db.getAsync('SELECT * FROM users WHERE role = "Admin"');
    if (!admin) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync('Admin123!', salt);
        await db.runAsync('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', hash, 'Admin']);
        console.log('Default admin created: admin / Admin123!');
    }
}

init().catch(console.error);

module.exports = db;
