const Nexus = {
    user: null,
    projects: [],

    init() {
        this.checkAuth();
        this.bindEvents();
        lucide.createIcons();
    },

    async checkAuth() {
        try {
            const res = await fetch('/api/me');
            if (res.ok) {
                this.user = await res.json();
                this.showDashboard();
            } else {
                this.showPage('auth-section');
            }
        } catch (err) {
            this.showPage('auth-section');
        }
    },

    bindEvents() {
        // Login
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Nav Links
        document.querySelectorAll('.nav-links li').forEach(li => {
            li.addEventListener('click', () => {
                const page = li.getAttribute('data-page');
                this.showTab(page);

                document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
                li.classList.add('active');
            });
        });

        // Add Project
        document.getElementById('add-project-btn').addEventListener('click', () => this.showAddProjectModal());

        // Modal close
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('modal-overlay').classList.add('hidden');
        });

        // Admin forms
        document.getElementById('create-user-form')?.addEventListener('submit', (e) => this.handleCreateUser(e));
        document.getElementById('change-password-form')?.addEventListener('submit', (e) => this.handleChangePassword(e));
        document.getElementById('setup-mfa-btn')?.addEventListener('click', () => this.handleMFASetup());
        document.getElementById('verify-mfa-btn')?.addEventListener('click', () => this.handleMFAVerify());
    },

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const token = document.getElementById('login-token').value;
        const errorEl = document.getElementById('login-error');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, token })
            });

            const data = await res.json();
            if (res.ok) {
                if (data.mfa_required) {
                    document.getElementById('mfa-field').classList.remove('hidden');
                    errorEl.textContent = 'MFA token required';
                    return;
                }
                this.user = data.user;
                this.showDashboard();
            } else {
                errorEl.textContent = data.error;
            }
        } catch (err) {
            errorEl.textContent = 'Login failed. Try again.';
        }
    },

    async handleLogout() {
        await fetch('/api/logout', { method: 'POST' });
        this.user = null;
        this.showPage('auth-section');
    },

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        document.getElementById(pageId).classList.remove('hidden');
    },

    showTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
        document.getElementById(`${tabName}-content`).classList.remove('hidden');

        const titles = {
            'dashboard': 'Dashboard',
            'projects': 'Projects',
            'admin': 'Team Management',
            'settings': 'Account Settings',
            'project-details': 'Project Details'
        };
        document.getElementById('page-title').textContent = titles[tabName] || 'Nexus';

        if (tabName === 'dashboard' || tabName === 'projects') this.loadProjects();
        if (tabName === 'admin') this.loadTeam();
        if (tabName === 'settings') this.loadSettings();
    },

    showDashboard() {
        this.showPage('dev-layout');
        this.showTab('dashboard');

        // Update user UI
        document.getElementById('nav-username').textContent = this.user.username;
        document.getElementById('nav-role').textContent = this.user.role;
        document.getElementById('nav-user-avatar').textContent = this.user.username[0].toUpperCase();

        if (this.user.role === 'Admin') {
            document.getElementById('admin-link').classList.remove('hidden');
            document.getElementById('add-project-btn').classList.remove('hidden');
        } else {
            document.getElementById('admin-link').classList.add('hidden');
            document.getElementById('add-project-btn').classList.add('hidden');
        }

        this.loadStats();
    },

    async loadStats() {
        try {
            const res = await fetch('/api/projects');
            const projects = await res.json();
            const active = projects.filter(p => p.status === 'Active').length;
            const completed = projects.filter(p => p.status === 'Completed').length;

            document.getElementById('stat-active-projects').textContent = active;
            document.getElementById('stat-completed-projects').textContent = completed;

            if (this.user.role === 'Admin') {
                const ures = await fetch('/api/users');
                const users = await ures.json();
                document.getElementById('stat-team-size').textContent = users.length;
            } else {
                document.getElementById('stat-team-size').textContent = '-';
            }
        } catch (err) { }
    },

    async loadProjects() {
        try {
            const res = await fetch('/api/projects');
            this.projects = await res.json();
            this.renderProjects(this.projects, 'project-list');
            this.renderProjects(this.projects, 'full-project-list');
        } catch (err) { }
    },

    renderProjects(projects, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = projects.map(p => `
            <div class="project-card glass-card" onclick="Nexus.viewProject(${p.id})">
                <span class="project-status status-${p.status.toLowerCase()}">${p.status}</span>
                <h4>${p.name}</h4>
                <p>${p.description || 'No description provided'}</p>
                <div class="project-footer">
                    <span><i data-lucide="calendar"></i> ${p.deadline}</span>
                    <i data-lucide="arrow-right"></i>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    },

    async viewProject(id) {
        try {
            const projectsRes = await fetch('/api/projects');
            const projects = await projectsRes.json();
            const project = projects.find(p => p.id === id);

            const teamRes = await fetch(`/api/projects/${id}/team`);
            const team = await teamRes.json();

            const docsRes = await fetch(`/api/projects/${id}/documents`);
            const docs = await docsRes.json();

            const view = document.getElementById('project-details-view');
            view.innerHTML = `
                <div class="details-header">
                    <span class="project-status status-${project.status.toLowerCase()}">${project.status}</span>
                    <h2>${project.name}</h2>
                    <p>${project.description || 'No description'}</p>
                    <small>Deadline: ${project.deadline}</small>
                </div>

                <div class="details-grid">
                    <div class="main-column">
                        <div class="docs-panel glass-card">
                            <h3>Project Documents</h3>
                            <div class="doc-list">
                                ${docs.length ? docs.map(d => `
                                    <div class="doc-item">
                                        <div class="doc-info">
                                            <i data-lucide="file-text"></i>
                                            <div>
                                                <strong>${d.original_name}</strong>
                                                <br><small>${new Date(d.upload_date).toLocaleDateString()}</small>
                                            </div>
                                        </div>
                                        <a href="/api/documents/${d.id}/download" class="btn-secondary" target="_blank"><i data-lucide="download"></i></a>
                                    </div>
                                `).join('') : '<p>No documents uploaded yet.</p>'}
                            </div>
                            
                            ${this.user.role !== 'Developer' ? `
                                <div class="upload-section">
                                    <h4>Upload New Document</h4>
                                    <form onsubmit="Nexus.handleUpload(event, ${project.id})">
                                        <input type="file" id="doc-file" required>
                                        <button type="submit" class="btn-primary" style="margin-top:10px">Upload</button>
                                    </form>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="side-column">
                         ${this.user.role === 'Admin' && project.status === 'Active' ? `
                            <button class="btn-primary" onclick="Nexus.completeProject(${project.id})" style="margin-bottom: 20px">
                                <i data-lucide="check-check"></i> Mark as Completed
                            </button>
                        ` : ''}

                        <div class="team-panel glass-card">
                            <h3>Team Members</h3>
                            <div class="team-list">
                                ${team.map(m => `
                                    <div class="team-member-item">
                                        <span>${m.username}</span>
                                        <small class="badge">${m.role_in_project}</small>
                                    </div>
                                `).join('')}
                            </div>
                            
                            ${this.user.role !== 'Developer' ? `
                                <button class="btn-secondary" onclick="Nexus.showAssignModal(${project.id})" style="width:100%; margin-top:15px">
                                    <i data-lucide="user-plus"></i> Assign Member
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;

            this.showTab('project-details');
            lucide.createIcons();
        } catch (err) {
            console.error(err);
        }
    },

    async handleUpload(e, projectId) {
        e.preventDefault();
        const fileInput = document.getElementById('doc-file');
        const formData = new FormData();
        formData.append('document', fileInput.files[0]);

        try {
            const res = await fetch(`/api/projects/${projectId}/documents`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                this.viewProject(projectId);
            }
        } catch (err) { }
    },

    async loadTeam() {
        const res = await fetch('/api/users');
        const users = await res.json();
        const container = document.getElementById('team-list');
        container.innerHTML = users.map(u => `
            <div class="member-item">
                <div>
                    <strong>${u.username}</strong>
                    <br><small>${u.role}</small>
                </div>
                <i data-lucide="user-cog"></i>
            </div>
        `).join('');
        lucide.createIcons();
    },

    async handleCreateUser(e) {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;

        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        if (res.ok) {
            alert('User created successfully');
            e.target.reset();
            this.loadTeam();
        } else {
            const data = await res.json();
            alert(data.error);
        }
    },

    showAddProjectModal() {
        const modalBody = document.getElementById('modal-body');
        document.getElementById('modal-title').textContent = 'New Project';
        modalBody.innerHTML = `
            <form id="add-project-form">
                <div class="input-group">
                    <label>Project Name</label>
                    <input type="text" id="p-name" required>
                </div>
                <div class="input-group">
                    <label>Description</label>
                    <textarea id="p-desc" rows="3"></textarea>
                </div>
                <div class="input-group">
                    <label>Deadline</label>
                    <input type="date" id="p-deadline" required>
                </div>
                <button type="submit" class="btn-primary">Create Project</button>
            </form>
        `;
        document.getElementById('modal-overlay').classList.remove('hidden');

        document.getElementById('add-project-form').onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('p-name').value;
            const description = document.getElementById('p-desc').value;
            const deadline = document.getElementById('p-deadline').value;

            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, deadline })
            });

            if (res.ok) {
                document.getElementById('modal-overlay').classList.add('hidden');
                this.loadProjects();
                this.loadStats();
            }
        };
    },

    async showAssignModal(projectId) {
        const usersRes = await fetch('/api/users');
        const users = await usersRes.json();

        const modalBody = document.getElementById('modal-body');
        document.getElementById('modal-title').textContent = 'Assign Team Member';
        modalBody.innerHTML = `
            <form id="assign-member-form">
                <div class="input-group">
                    <label>Select Member</label>
                    <select id="assign-user-id">
                        ${users.map(u => `<option value="${u.id}">${u.username} (${u.role})</option>`).join('')}
                    </select>
                </div>
                <div class="input-group">
                    <label>Role in Project</label>
                    <select id="assign-role">
                        <option value="Developer">Developer</option>
                        <option value="Lead">Lead</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">Assign Member</button>
            </form>
        `;
        document.getElementById('modal-overlay').classList.remove('hidden');

        document.getElementById('assign-member-form').onsubmit = async (e) => {
            e.preventDefault();
            const user_id = document.getElementById('assign-user-id').value;
            const role_in_project = document.getElementById('assign-role').value;

            const res = await fetch(`/api/projects/${projectId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id, role_in_project })
            });

            if (res.ok) {
                document.getElementById('modal-overlay').classList.add('hidden');
                this.viewProject(projectId);
            } else {
                const data = await res.json();
                alert(data.error);
            }
        };
    },

    async completeProject(id) {
        if (!confirm('Mark this project as completed?')) return;
        const res = await fetch(`/api/projects/${id}/complete`, { method: 'PATCH' });
        if (res.ok) this.viewProject(id);
    },

    async loadSettings() {
        const res = await fetch('/api/me');
        const user = await res.json();
        const statusEl = document.getElementById('mfa-status');
        if (user.mfa_enabled) {
            statusEl.innerHTML = '<span class="badge active">Enabled</span>';
            document.getElementById('mfa-setup-area').classList.add('hidden');
        } else {
            statusEl.innerHTML = '<span class="badge">Disabled</span><button id="setup-mfa-btn" class="btn-secondary" onclick="Nexus.handleMFASetup()">Setup MFA</button>';
        }
    },

    async handleMFASetup() {
        const res = await fetch('/api/mfa/setup', { method: 'POST' });
        const data = await res.json();
        document.getElementById('mfa-qr').src = data.qrcode;
        document.getElementById('mfa-setup-area').classList.remove('hidden');
    },

    async handleMFAVerify() {
        const token = document.getElementById('mfa-verify-token').value;
        const res = await fetch('/api/mfa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        if (res.ok) {
            alert('MFA Enabled successfully!');
            this.loadSettings();
        } else {
            alert('Invalid token');
        }
    },

    async handleChangePassword(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('curr-pass').value;
        const newPassword = document.getElementById('new-pass').value;

        const res = await fetch('/api/account/password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (res.ok) {
            alert('Password updated');
            e.target.reset();
        } else {
            const data = await res.json();
            alert(data.error);
        }
    }
};

window.onload = () => Nexus.init();
