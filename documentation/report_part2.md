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
