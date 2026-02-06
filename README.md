# PixelForge Nexus - Secure Project Management Prototype

## Credentials
- **Admin**: `admin` / `Admin123!`
- **Other Users**: Created by Admin via the dashboard.

## Setup Instructions
1. Ensure Node.js is installed.
2. Run `npm install` (if not already done).
3. Run `npm start`.
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features
- **RBAC**: Admin, Project Lead, Developer roles.
- **MFA**: TOTP-based Multi-Factor Authentication (setup in Settings).
- **Secure File Storage**: Documents are stored in `uploads/` with access control.
- **Project Tracking**: Manage lifecycles from Active to Completed.

## Technical Stack
- **Backend**: Node.js, Express
- **Database**: SQLite (via `sqlite3`)
- **Frontend**: Vanilla JS, Modern CSS (Glassmorphism)
- **Security**: BcryptJS, Express-Session, Speakeasy (MFA)
