# Security Architecture & Design Document (LOS MVP)

This document describes the security controls, authentication systems, data protection schemes, and compliance audit frameworks implemented within the Loan Origination System (LOS) MVP.

---

## 1. Authentication & Session Management

### 1.1 Stateless JWT Authentication
- **Mechanism**: JSON Web Tokens (JWT) are issued upon successful authentication.
- **Algorithm**: signed with `HS256` using the secure `JWT_SECRET` loaded from environment configurations.
- **Expiration**: Tokens are configured with a default validity of **8 hours** to limit the window of session vulnerability.
- **Frontend Storage**: JWT tokens are securely stored in browser `localStorage` and injected as `Authorization: Bearer <token>` in the HTTP headers of all API client calls.

### 1.2 One-Time Password (OTP) Authentication
- **Mechanism**: Email-based OTP login is available alongside traditional password authentication.
- **Delivery**: A 6-digit numeric code is sent to the registered email via Nodemailer.
- **Validation**:
  - The generated OTP is hashed using `Bcryptjs` before being stored in the database.
  - The OTP is valid for exactly **10 minutes**.
  - Rate limiting and email existence checks are obfuscated (returns a generic success message) to prevent user enumeration.

### 1.3 Password Hashing
- **Algorithm**: `Bcryptjs` is utilized to hash all user password credentials.
- **Work Factor**: A salt round factor of `10` is enforced to ensure protection against brute-force attacks while preserving server request capacity.

---

## 2. Sensitive Data Protection (PII)   

### 2.1 Encryption at Rest (AES-256-GCM)
Under financial industry compliance requirements, storing customer Permanent Account Numbers (PAN) in plain text is prohibited.
- **Algorithm**: **AES-256-GCM** (Advanced Encryption Standard in Galois/Counter Mode).
- **Reasoning**:
  1. *Confidentiality*: Leverages a strong 256-bit symmetric key.
  2. *Authenticity & Integrity*: Galois Counter Mode produces an authentication tag alongside ciphertext. During decryption, the system verifies this tag to guarantee the ciphertext has not been tampered with or modified.
- **Payload Format**: Ciphertexts are stored in the database in the format: `iv_hex:auth_tag_hex:ciphertext_hex`.

### 2.2 Key Management
- The symmetric 32-byte encryption key is loaded from the `ENCRYPTION_KEY` environment variable.
- The server validates this key format on startup, enforcing that it must be a **64-character hexadecimal string**.

---

## 3. Role-Based Access Control (RBAC) & PII Masking

The system implements a strict Role-Based Access Control matrix to limit lifecycle transitions and protect data visibility:

| Role | PAN Card Visibility | Permitted Status Transitions & Operations |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | **Full (Unmasked)** | Full access across all applications, documents, users, and audit log registries. |
| **LOAN_OFFICER** | **Full (Unmasked)** | Create DRAFT applications, upload documents, SUBMIT cases, and record customer invitations. |
| **CREDIT_ANALYST** | **Masked (`******1234`)** | Start reviews (`UNDER_REVIEW`), verify documents, and perform credit assessments. |
| **APPROVER** | **Masked (`******1234`)** | Finalize loan approvals (`APPROVED`), generate pricing offers, and execute disbursements. |
| **CUSTOMER** | **Hidden** | Self-access application timeline, upload/replace docs, accept/decline offers, track repayments. No visibility of other applicants' files. |

### 3.1 PII Masking Rules
PAN masking is enforced dynamically inside service layers based on the authenticated requestor's role:
- Full PAN is revealed only to the originating Loan Officer or Super Admin.
- Credit Analysts and Approvers only see the last 4 characters of the decrypted PAN string (e.g., `******1234`), preventing unnecessary PII leakage during reviews.
- Customer users are not returned PAN information in portal GET selectors.

---

## 4. Customer Portal Security Isolation (Phase 6)
To secure client self-service interactions, the portal implements multi-layered isolation:
1. **Route Guarding**: All customer routes (`/customer/*` namespace) are protected by a customer-specific JWT authorization check. Non-customer tokens (e.g. employee roles) are immediately rejected and redirected.
2. **Database Ownership Check**: Every database query on customer-facing services enforces a mandatory `customerUserId` validation:
   `where: { id: applicationId, customerUserId: authenticatedUserId }`
   This guarantees that a customer can never query, read, or update files or documents belonging to another applicant, even if they guess the application UUID.
3. **Decoupled Notification Architecture**: Customer portal notifications are recorded in a separate `CustomerNotification` table rather than the standard compliance `AuditLog` table. This prevents client activity logs from cluttering SOC 2 compliance registries.
4. **Temporary OTP Invitation**: Customer invitations use temporary 48-hour expiration verification hashes. Customers must complete a secure set-password flow to activate their portal account.

---

## 5. Compliance Auditing & Logging

### 5.1 Immutable Audit Logging
- Every lifecycle status change, assessment, document verification, login attempt, or database edit creates an immutable entry in the `AuditLog` database table.
- **Log Structure**: Tracks executing User ID, Action, Details, Client IP Address, and Timestamp.
- **Transactional Consistency**: Status history updates and status changes are bundled in a single database transaction block. If any step fails, the entire transition rolls back.

---

## 6. Fail-Fast Boot Validation
To prevent the server from running in a compromised state, the system performs strict boot validations:
1. Validates that `DATABASE_URL`, `JWT_SECRET`, and `ENCRYPTION_KEY` environment variables are present.
2. Validates that `ENCRYPTION_KEY` matches a 32-byte hex format.
3. If any check fails, the application prints a critical configuration error and immediately exits (`process.exit(1)`).

