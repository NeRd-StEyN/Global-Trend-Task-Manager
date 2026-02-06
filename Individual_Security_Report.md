# PixelForge Nexus: Individual Security Report

**Student Name:** [Your Name]
**Date:** July 2025
**Project:** PixelForge Nexus - Secure Project Management System

---

## 1. Introduction
PixelForge Nexus is a centralized project management platform designed for "Creative SkillZ LLC" to streamline the management of game development projects, team assignments, and secure document sharing. This report details the design, development, and security validation of the Nexus system, emphasizing "Security by Design" principles to protect intellectual property and ensure robust user access control.

## 2. System Design (35%)

### 2.1 Design Principles
The architecture of PixelForge Nexus is built upon several foundational security principles:

1.  **Principle of Least Privilege (PoLP):** The system implements a granular Role-Based Access Control (RBAC) model.
    *   **Admin:** Full system oversight, user management, and project lifecycle control.
    *   **Project Lead:** Controlled access to specific projects they lead, including team assignment and document management.
    *   **Developer:** Read-only access to assigned projects and associated resources.
2.  **Defense in Depth:** Multiple layers of security are employed:
    *   **Authentication Layer:** Strong password hashing (BcryptJS) + Multi-Factor Authentication (MFA).
    *   **Session Layer:** Secure, HTTP-only session cookies to mitigate Cross-Site Scripting (XSS) based cookie theft.
    *   **Database Layer:** Parameterized queries to prevent SQL Injection (SQLi).
3.  **Secure Defaults:** By default, new users have no project access until explicitly assigned by an Admin or Lead.

### 2.2 Threat Modelling (STRIDE)
A threat model was conducted using the STRIDE framework:
*   **Spoofing:** Mitigated by robust session management and MFA.
*   **Tampering:** Protected via server-side validation of all project modifications.
*   **Repudiation:** Database logs track user actions (e.g., document uploads).
*   **Information Disclosure:** RBAC ensures users only see what is relevant to them.
*   **Denial of Service:** Handled via platform-level protections (e.g., Express middleware for request limits).
*   **Elevation of Privilege:** Strict server-side role checks on every API endpoint.

### 2.3 Access Control Mechanisms
Access is enforced at the API level using custom middleware (`isAuthenticated` and `hasRole`). This ensures that even if a user manipulates the frontend UI, the backend will reject unauthorized requests.

---

## 3. Security Testing and Analysis (35%)

### 3.1 Authentication Analysis
The login system was tested for common vulnerabilities:
*   **Brute Force:** While not fully implemented in the prototype, the integration of MFA significantly increases the barrier for brute-force attacks.
*   **Credential Stuffing:** Mitigated by requiring MFA for sensitive accounts.
*   **Password Storage:** Evaluated BcryptJS with a cost factor of 10, ensuring passwords are resistant to rainbow table attacks.

### 3.2 Vulnerability Assessment
During development, the following issues were identified and addressed:
1.  **Issue:** Potential for IDOR (Insecure Direct Object Reference) in document downloads.
    *   **Solution:** Implemented a secondary check in the `/api/documents/:id/download` route to verify the user is assigned to the parent project before allowing the download.
2.  **Issue:** File upload vulnerabilities (e.g., uploading malicious scripts).
    *   **Solution:** Used `multer` with a controlled storage destination and kept original filenames separate from system filenames to prevent directory traversal.

### 3.3 Test Cases
| Test ID | Description | Expected Result | Actual Result | Status |
|---------|-------------|-----------------|---------------|--------|
| TC-01 | Unauthorized page access | Redirect to Login | Redirected | PASS |
| TC-02 | Developer accessing Admin panel | 403 Forbidden | 403 Forbidden | PASS |
| TC-03 | MFA token verification | Reject invalid tokens | Token rejected | PASS |
| TC-04 | SQL Injection attempt | Query fails/No data leaked | Rejected (Params) | PASS |

---
**[Continue in next section...]**
## 4. System Development (20%)

### 4.1 Implementation Details
PixelForge Nexus was developed using a modern Node.js stack. The choice of libraries was made with a focus on security and reliability:
*   **Express.js:** Used for the web server due to its maturity and extensive middleware ecosystem.
*   **SQLite3:** Selected for data persistence. It allows the entire prototype to be bundled easily while still supporting robust SQL queries and ACID compliance.
*   **BcryptJS:** Implements the Blowfish cipher for deterministic hashing. Unlike simple MD5 or SHA-1, Bcrypt is computationally expensive, thwarting hardware-accelerated cracking attempts.
*   **Speakeasy & QRCode:** Integrated for RFC 6238 compliant Time-based One-Time Passwords (TOTP), providing a industry-standard MFA solution.

### 4.2 Legal and Ethical Context
As an external consultant for Creative SkillZ LLC, the development followed ethical guidelines:
*   **Data Privacy:** Minimal Personal Identifiable Information (PII) is collected (only usernames).
*   **Legal Compliance:** The system is designed to facilitate GDPR compliance by allowing users to update their credentials and ensuring data is not accessible by unauthorized third parties.
*   **Integrity:** The system ensures that project data cannot be deleted or altered by developers, maintaining the integrity of the creative process.

---

## 5. Formal Methods (10%)

### 5.1 Behavioural Model
The authentication flow can be modelled as a Finite State Machine (FSM):

1.  **S0 (Logged Out):** Initial state. User inputs credentials.
2.  **S1 (Authenticating):** Server validates password hash.
    *   If invalid -> Transition to **S0** (Error shown).
    *   If valid and MFA disabled -> Transition to **S2 (Authenticated)**.
    *   If valid and MFA enabled -> Transition to **S3 (MFA Challenge)**.
3.  **S3 (MFA Challenge):** User inputs TOTP.
    *   If invalid -> Transition to **S0** (Error shown, Session invalidated).
    *   If valid -> Transition to **S2 (Authenticated)**.
4.  **S2 (Authenticated):** Access granted to Dashboard.

### 5.2 Verification
Correctness was verified through state-reachability testing. By forcing the MFA state, we ensured there is no path to "Authenticated" without the correct cryptographic token if the `mfa_enabled` flag is set.

---

## 6. Conclusion
PixelForge Nexus successfully demonstrates how secure design principles can be integrated into a functional business tool. From the use of RBAC to the implementation of TOTP MFA, the prototype provides a secure, extensible foundation for project management at Creative SkillZ LLC. Future iterations could include encrypted file storage at rest and audit logging to a centralized SIEM.

---

## 7. Appendix: Test Credentials
*   **Admin Username:** `admin`
*   **Admin Password:** `Admin123!`
*   **Note:** MFA is disabled by default for the first login but can be enabled in the Settings tab using any standard TOTP app.
