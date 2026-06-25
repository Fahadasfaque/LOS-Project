# Product Requirements Document (PRD) - Loan Origination System (LOS) MVP

## 1. Overview
The Loan Origination System (LOS) is an enterprise-grade platform designed to streamline and automate the end-to-end lifecycle of a loan, from application submission to credit assessment, approval, and disbursement.

This MVP serves as a secure, role-based foundation implementing core user authentication, Role-Based Access Control (RBAC), database design, security/encryption standards, audit logging, and the complete loan lifecycle origination pipeline.

---

## 2. User Roles & Access Matrix
The system is built around four primary roles, each representing a critical persona in the lending workflow:

| Role | Description | Key Functions in Full System | Phase 2 Scope |
| :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | System Administrator | Manages users, configures system variables, views system-wide audit logs. | Full access to User Management, Audit Logs, and all Applications/Documents. |
| **LOAN_OFFICER** | Relationship Manager | Creates loan applications, uploads customer documents, performs initial validation. | Creates DRAFT applications, uploads document references, submits applications, views own originations. |
| **CREDIT_ANALYST** | Risk Assessor | Evaluates financial creditworthiness, assigns credit score, makes approval recommendations. | Risk Assessment Queue: reviews applications, verifies/rejects documents, recommends approve/reject status. |
| **APPROVER** | Credit Manager / Committee | Review final applications, approve or reject loan limits, authorize disbursement. | Final Approval Queue: reviews underwriting logs, signs off approvals, authorizes final disbursements. |

---

## 3. Core Capabilities

### 3.1 Authentication & Security
- **Authentication**: JWT-based stateless authentication with token expiry (default 8 hours).
- **Password Security**: Bcrypt hashing (rounds: 10) for all user credentials.
- **Data Protection**: AES-256-GCM encryption for all highly sensitive fields (e.g., PAN) when stored in the database.
- **PAN Visibility Rules**:
  - `SUPER_ADMIN` and `LOAN_OFFICER` view the full unmasked PAN Card Number.
  - `CREDIT_ANALYST` and `APPROVER` view the masked PAN (e.g. `*****`).
- **Session Management**: Secure storage of token on frontend, automatic redirection of unauthenticated requests to login, token clearing on logout.

### 3.2 Audit Logging & Status Histories
- Every status transition creates an immutable record in both the `AuditLog` table and `StatusHistory` table within a single transactional block.
- Logs include: Timestamp, User ID, Action, Details, and IP address.
- Logs are immutable and visible only to `SUPER_ADMIN`.
- Status history logs are exposed to show the vertical audit trail timeline for each individual application.

### 3.3 Dashboard Shell & KPIs
- Collapsible sidebar with role-aware navigation options.
- Dynamic dashboard page showcasing high-level KPIs based on the authenticated user's role, pulling real loan lifecycle metrics:
  - Loan Officer: Total applications, drafts pending submission, active review counts, closed disbursements.
  - Credit Analyst: Underwriting queue size, under review counts, evaluated cases, rejections.
  - Approver: Pending approvals, total disbursed payout limits, average SLA turnaround metrics.

### 3.4 Loan Lifecycle Status Workflow
Strict state transitions enforced by workflow rules:
1. `DRAFT`: Form profiling and document uploading (Loan Officer).
2. `SUBMITTED`: Underwriting submission (Loan Officer).
3. `UNDER_REVIEW`: Core risk assessment and document checks (Credit Analyst).
4. `APPROVED`: Underwriting assessment approved. Ready for offer generation.
5. `OFFER_GENERATED`: Loan terms, annual interest rate, and tenure generated. Default offer validity is 7 days.
6. `OFFER_ACCEPTED`: Customer acceptance of offer recorded in system.
7. `REJECTED`: Application rejected.
8. `DISBURSED`: Payout reference logged and funds disbursed successfully.

### 3.5 Credit Assessment & Underwriting
- **Pending Assessment Initialization**: A pending assessment object is automatically initialized when an application enters `UNDER_REVIEW`.
- **Underwriting Calculations**: The underwriting decision engine checks monthly income to calculate credit score, risk level, and recommendations:
  - **LOW Risk / Recommend APPROVE**: Net monthly income is ₹50,000 or more. Credit Score set to `780`.
  - **MEDIUM Risk / Recommend MANUAL_REVIEW**: Net monthly income is between ₹30,000 and ₹49,999. Credit Score set to `700`.
  - **HIGH Risk / Recommend REJECT**: Net monthly income is below ₹30,000. Credit Score set to `620`.
- **Assessment Audit Logs**:
  - Initializing or completing assessments writes `ASSESSMENT_CREATED` and `ASSESSMENT_COMPLETED` audit logs.
  - Assessments do **NOT** generate timeline status histories.
- **Approval Guard**:
  - Applications cannot transition to `APPROVED` unless a completed assessment exists in the system.

---

## 4. Out of Scope for MVP
- OCR engine integration.
- Credit Bureau (e.g. CIBIL) APIs.
- Aadhaar/PAN validation APIs.
- SMS notifications (Emails are supported).
- Payment gateway integrations.
