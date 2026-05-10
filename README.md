# 🗳️ Vigilant Vote: Secure Grievance Management System

**Vigilant Vote** is a high-security, multi-tier reporting platform designed for election integrity. It empowers citizens to report election-related grievances with absolute privacy while providing election officials with a structured, audited, and secure environment for investigation and resolution.

---

## 🌟 Key Features

### 🗳️ For Citizens (Voters)
-   **Secure Registration**: Passwordless login using high-speed Email OTP.
-   **Private Reporting**: Submit grievances that are encrypted before they ever leave the device.
-   **Evidence Attachment**: Securely upload images or documents to support claims.
-   **Grievance Tracking**: View the live status (Pending, Investigating, Resolved) of your own reports.

### 🛡️ For Administrative Hub (Admins)
-   **Audit Dashboard**: A comprehensive view of all grievances across the state/district.
-   **Interactive Heatmap**: Visualize grievance density in real-time to identify high-risk booths or regions.
-   **Multi-Factor Decryption**: Read sensitive complaints only after secondary password re-authentication.
-   **Status Management**: Update grievance progress and keep the investigation timeline transparent.

### 👑 For Chief Commissioners (Superadmin)
-   **Privilege Management**: Full control over the administrative team (Grant or Revoke admin access).
-   **Admin Auditing**: Monitor which administrators are active in the system.
-   **Credential Control**: Set and manage passwords for the entire monitoring team.

---

## 🔒 Security Protocols & Architecture

The project employs a **Defense-in-Depth** strategy, utilizing multiple layers of modern security protocols.

### 1. Cryptographic Security
-   **AES-256 Encryption**: Every grievance is encrypted on the **client-side** using `crypto-js`. The backend never sees the "plain text" of a complaint unless an authorized admin decrypts it.
-   **bcrypt Hashing**: Administrator passwords are never stored in plain text. They are salted and hashed using `bcrypt` (10 rounds) to prevent brute-force or rainbow table attacks.
-   **Zero-Knowledge Storage**: The server stores only the encrypted payload, ensuring data privacy even in the case of a full database leak.

### 2. Authentication & Authorization
-   **JWT (JSON Web Tokens)**: Secure, signed session tokens manage all user interactions. Tokens are set with a 24-hour expiration for security.
-   **Multi-Factor Authorization (MFA)**: A "Digital Seal" protocol requires admins to provide their login password *again* before they can view sensitive text or download evidence files.
-   **Role-Based Access Control (RBAC)**: Strict server-side middleware (`protect` & `authorize`) prevents standard users from accessing administrative endpoints.
-   **Session Binding**: Optional browser fingerprinting binds a voter's session to their unique device hardware, neutralizing session hijacking attempts.

### 3. Network & Infrastructure Security
-   **Helmet.js Integration**: Automatically sets secure HTTP headers to mitigate common web vulnerabilities like XSS, clickjacking, and MIME-sniffing.
-   **CORS Protection**: Restricted Cross-Origin Resource Sharing ensures that only authorized frontend domains can communicate with the API.
-   **Input Sanitization**: All data entering the system is parsed and validated via Mongoose schemas to prevent injection attacks.

---

## 🛠️ Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (NoSQL) |
| **Security** | bcrypt, crypto-js, jsonwebtoken, helmet |
| **Mail** | Nodemailer (SMTP with TLS) |

---

## 🚀 Deployment & Installation

### Backend Setup
1. `cd backend`
2. `npm install`
3. Configure `.env` with `MONGO_URI`, `JWT_SECRET`, and `SMTP` credentials.
4. `node index.js`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---

## 📜 System Integrity
All administrative actions within **Vigilant Vote** are logged for audit transparency, ensuring that every mark of "Resolved" or every "Decryption Action" is accountable to an authorized official.
