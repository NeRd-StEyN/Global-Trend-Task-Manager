# Video Report Script (8 Minutes or Less)

## 0:00 - 1:00 | Introduction
- Show the Login Page.
- Explain the project: PixelForge Nexus, a secure project management hub.
- Highlights: Built with Node.js, Express, and SQLite with a focus on RBAC and MFA.

## 1:00 - 3:00 | Functional Walkthrough (Roles)
- **Login as Admin**: Show the dashboard, stats, and Team Management.
- **Create a User**: Register a new Developer.
- **Project Creation**: Create a new game project (e.g., "Cyber Quest").

## 3:00 - 5:00 | Project Management & Team Assignment
- **Assign Team**: Show the Project Lead or Admin assigning a Developer to the project.
- **Document Upload**: Upload a sample "Design Document.txt".
- **Switch User**: Logout and log in as the newly created Developer. Show that they ONLY see their assigned project.

## 5:00 - 7:00 | Security Demonstration
- **RBAC in action**: Try to access the Team Management link as a Developer (it's hidden). Mention the server-side role checks.
- **MFA Setup**: Go to Settings -> Enable MFA. Show the QR code. Logout and show the MFA challenge on login.
- **Password Update**: Show the password change functionality.

## 7:00 - 8:00 | Design & Conclusion
- Point out the "Premium" design: Dark mode, glassmorphism, responsive UI.
- Summarize the security principles: PoLP, Defense in Depth, and Secure Storage.
- Final words on the project success.
