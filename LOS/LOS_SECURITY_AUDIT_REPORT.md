# Loan Origination System (LOS)
## Security Audit Report (SAST, SCA, DAST, API, Secret, Vulnerability, Pentesting, & Compliance)

---

## Document Control & Metadata
- **Classification**: Confidential / Security Board Review
- **Author**: Security Architect & Principal Technical Auditor
- **Date of Issue**: July 2, 2026
- **System Version**: 1.0.0-MVP
- **Target Audience**: Chief Technology Officer (CTO), Chief Information Security Officer (CISO), Compliance Audit Lead, Lead Security Engineer

---

## Executive Summary
This report presents the findings of a comprehensive security audit performed on the **Loan Origination System (LOS)** codebase. The assessment covers both static code architectures and dynamic runtime configurations across the Next.js 15 frontend and Express.js backend. 

The audit evaluates the system against eight critical security domains to ensure it meets enterprise banking security baselines, RBI compliance, and data protection guidelines.

---

## 1. Static Application Security Testing (SAST)
SAST analyzes the application source code without execution to identify security vulnerabilities, logical flaws, and data flow risks.

### 1.1 Cross-Site Scripting (XSS)
- **Frontend Assessment**: The frontend is built using Next.js 15 and React 19. React's virtual DOM renders text content dynamically by auto-escaping strings, which mitigates standard HTML injection and XSS vectors.
- **`dangerouslySetInnerHTML` Audit**: A static sweep of the frontend codebase identified only one instance of `dangerouslySetInnerHTML`:
  - **Location**: [login/page.tsx](file:///c:/Users/Admin/Desktop/LOS/LOS/Frontend/src/app/login/page.tsx#L495)
  - **Context**: Renders a static `<style>` block containing CSS animation rules (`pulse-blue-glow`, etc.) inside the Glassmorphic login card.
  - **Risk Rating**: **Safe / False Positive**. The styling content is completely static and does not incorporate any dynamic user-supplied inputs or search query variables.
- **Recommendation**: Avoid styling elements through `dangerouslySetInnerHTML`. Use standard CSS stylesheets or dynamic Tailwind configurations.

### 1.2 SQL Injection (SQLi)
- **Backend Assessment**: The backend uses **Prisma ORM** for database interaction. Prisma implements parameterized queries for all operations, which prevents SQL injection attacks.
- **Raw Query Audit**: A sweep for raw query functions (`prisma.$queryRaw` or `prisma.$executeRaw`) returned **zero occurrences** in the repository files. All database operations use Prisma's safe query generation methods (e.g., `findFirst`, `update`, `create`).
- **Risk Rating**: **Safe**. SQL injection risks are mitigated by the architecture's reliance on Prisma's parameterized database layer.

### 1.3 Unsafe Direct Object References (IDOR / BOLA)
- **Access Controls**: The system enforces authorization checks to prevent users from accessing or modifying other users' resources:
  - **Customer Workspace Isolation**: Enforced in [customer.repository.ts](file:///c:/Users/Admin/Desktop/LOS/LOS/Backend/src/repositories/customer.repository.ts#L80) and [customer.service.ts](file:///c:/Users/Admin/Desktop/LOS/LOS/Backend/src/services/customer.service.ts#L223). Every query fetching application details or uploading documents for the customer portal incorporates the authenticated customer's ID:
    ```typescript
    prisma.loanApplication.findFirst({
      where: { id: applicationId, customerUserId }
    })
    ```
    This prevents borrowers from accessing other borrowers' accounts by changing URL parameters.
  - **Employee Workspace Isolation**: Enforced in [loanApplication.service.ts](file:///c:/Users/Admin/Desktop/LOS/LOS/Backend/src/services/loanApplication.service.ts#L335) for Loan Officers:
    ```typescript
    if (role === 'LOAN_OFFICER' && app.userId !== userId) {
      throw new ForbiddenError('Access denied: You can only view applications you created.');
    }
    ```
    This restricts Loan Officers from viewing applications assigned to other relationship managers.
- **Risk Rating**: **Low Risk**. IDOR is prevented at the database and service layers.

### 1.4 Hardcoded Cryptographic Keys & Sensitive Data Masking Flaw
- **Hardcoded Keys**: No hardcoded production secret keys were found in the source code. Cryptographic keys (like `JWT_SECRET` and `ENCRYPTION_KEY`) are fetched from environment variables.
- **Symmetric Encryption**: PAN card numbers are encrypted at rest using AES-256-GCM in [encryption.ts](file:///c:/Users/Admin/Desktop/LOS/LOS/Backend/src/utils/encryption.ts).
- **PAN Masking Logic Discrepancy**: A code inspection identified a discrepancy in [masking.ts](file:///c:/Users/Admin/Desktop/LOS/LOS/Backend/src/utils/masking.ts#L17) between the code implementation and its security comments:
  - **Security Comment**: States that only `SUPER_ADMIN` and `LOAN_OFFICER` are allowed to view unmasked PAN numbers, while `CREDIT_ANALYST` and `APPROVER` should see masked values (`******1234`).
  - **Code Implementation**:
    ```typescript
    if (
      role === Role.SUPER_ADMIN ||
      role === Role.LOAN_OFFICER ||
      role === Role.CREDIT_ANALYST
    ) {
      return pan;
    }
    ```
    The code returns the unmasked, raw PAN number to `CREDIT_ANALYST` users as well. This exposes sensitive PII to users who do not require it for their duties.
  - **Risk Rating**: **Medium Risk / Compliance Violation**. Exposes raw PII (PAN numbers) to unnecessary operational roles, violating data minimization principles.
- **Recommendation**: Align the code in `masking.ts` with the security specifications by removing `Role.CREDIT_ANALYST` from the unmasked return condition.

---

## 2. Software Composition Analysis (SCA)
SCA audits application dependencies, packages, and frameworks to detect vulnerable libraries (CVEs) and license compliance issues.

### 2.1 Backend Dependencies (`Backend/package.json`)
The Express backend includes the following dependencies:
- **`express` (`^5.2.1`)**: Express v5.x includes improvements in routing, but since it is in prerelease/active development, dependencies must be monitored for stability issues.
- **`jsonwebtoken` (`^9.0.3`)**: Handles JWT creation. Vulnerable to certain signature-bypass attacks in older versions; must be kept updated.
- **`pdf-creator-node` (`^4.0.1`)**: Uses **`html-pdf`** internally, which relies on **`phantomjs`** (a deprecated tool). This library is known to have vulnerabilities, including arbitrary file writes and XSS execution during PDF rendering.
- **`bcryptjs` (`^3.0.3`)**: A pure JavaScript implementation of bcrypt. While functional, it is slower than the native C++ `bcrypt` library, making it more vulnerable to denial-of-service (DoS) attacks via CPU exhaustion when processing multiple login requests.

### 2.2 Frontend Dependencies (`Frontend/package.json`)
The Next.js 15 client includes the following dependencies:
- **`next` (`15.5.19`)**, **`react` (`19.1.0`)**: Standard library versions.
- **`gsap` (`^3.15.0`)**: Used for page animations. Safe, but contributes to a larger initial bundle size.

### 2.3 License Compliance
- The libraries used in the package configurations (MIT, Apache-2.0, ISC) comply with standard commercial software licensing requirements. No GPL-licensed components are present.

### 2.4 Transitive Sub-Dependencies
- The lack of lockfiles (`package-lock.json` or `yarn.lock`) in the audited repository poses a risk. Without locked transitive dependencies, builds are vulnerable to supply-chain attacks if upstream packages are compromised.

### SCA Recommendations:
1. **Replace `pdf-creator-node`**: Transition to a modern PDF rendering library (e.g., `pdfkit` or `puppeteer`) that does not rely on deprecated and vulnerable dependencies like PhantomJS.
2. **Commit Lockfiles**: Ensure `package-lock.json` is committed to the Git repository to secure the dependency tree.
3. **Execute Dependency Audits**: Run `npm audit` in both directories to identify and patch nested vulnerabilities.

---

## 3. Dynamic Application Security Testing (DAST)
DAST simulates external attacks on the running application to evaluate transport security, session management, and authentication flow vulnerabilities.

### 3.1 Session & Cookie Security
- **JWT Transport**: The system uses Bearer JWT tokens passed in the HTTP `Authorization` header. This is a common pattern for stateless APIs, but it means the token must be stored on the client side (typically in `localStorage`).
- **Storage Risk**: Tokens stored in client-side `localStorage` are vulnerable to extraction if the application suffers an XSS vulnerability.
- **Cookie Security**: The API does not use cookies for session management.
- **Recommendation**: Transition session storage to secure HTTP-only cookies with the `Secure`, `HttpOnly`, and `SameSite=Strict` flags enabled. This prevents client-side scripts from accessing the session token, mitigating XSS risks.

### 3.2 Security Header Analysis
- **Audited Configuration**: An inspection of the Express initialization file [index.ts](file:///c:/Users/Admin/Desktop/LOS/LOS/Backend/src/index.ts) shows that the backend does not configure security headers.
- **Vulnerabilities**:
  - **No Content Security Policy (CSP)**: The server does not send CSP headers, exposing the application to clickjacking and script injection attacks.
  - **No Clickjacking Protection**: Missing the `X-Frame-Options` header, which allows the application to be embedded in unauthorized iframes.
  - **No MIME Sniffing Protection**: Missing the `X-Content-Type-Options: nosniff` header.
- **Recommendation**: Integrate the `helmet` middleware in `index.ts` to automatically configure standard secure HTTP headers:
  ```typescript
  import helmet from 'helmet';
  app.use(helmet());
  ```

### 3.3 Public Endpoints & Brute Force Protection
- **Vulnerability**: Critical authentication endpoints (e.g., `/api/v1/auth/login`, `/api/v1/auth/otp/request`, and `/api/v1/auth/otp/verify`) lack rate-limiting configurations.
- **Impact**: Attackers can perform brute-force password guessing or OTP enumeration attacks without being throttled or blocked by the server.
- **Recommendation**: Add a rate-limiting middleware (e.g., `express-rate-limit`) to restrict requests to authentication endpoints:
  ```typescript
  import rateLimit from 'express-rate-limit';
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per window
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api/v1/auth', authLimiter);
  ```

---

## 4. API Security Testing
API Security Testing evaluates the API endpoints against authentication bypasses, data validation issues, and authorization flaws.

### 4.1 Broken Object Level Authorization (BOLA)
- **Authentication Check**: API routes are protected by the `authenticate` and `requireRole` middlewares, preventing unauthenticated access to system endpoints.
- **Verification**: BOLA is mitigated for customer-facing routes. In [customer.repository.ts](file:///c:/Users/Admin/Desktop/LOS/LOS/Backend/src/repositories/customer.repository.ts), queries for applications and documents require the authenticated `customerUserId` to match, preventing IDOR/BOLA bypasses.

### 4.2 Rate Limiting
- **Status**: **Missing**. The backend lacks rate-limiting mechanisms at the application level. This exposes the system to Denial of Service (DoS) attacks and brute-force attempts on sensitive endpoints.

### 4.3 JWT Verification & Revocation
- **Expiration Logic**: JWT tokens are signed with HS256 and have an 8-hour expiration. This is a reasonable expiration window, but it is long enough for a compromised token to be used maliciously.
- **Revocation Check**: The API verifies the token signatures statelessly but does not implement a token revocation check. When a user clicks "Logout" on the client, the token is deleted from `localStorage`, but the token itself remains valid on the server until its 8-hour expiration window passes.
- **Recommendation**: Implement a token blacklist database (using Redis) to track revoked tokens. The `authenticate` middleware should query the blacklist to reject invalid tokens before processing requests.

### 4.4 Mass Assignment (Object Injection)
- **Status**: **Mitigated**. The API protects against mass assignment vulnerabilities by using Zod schema validators (`validateRequest` middleware) on POST and PUT request bodies. These validators act as strict whitelists, ignoring fields that are not defined in the schema (such as injecting `status: "APPROVED"` into a create application payload).

---

## 5. Secret Scanning
Secret Scanning inspects files and repositories for hardcoded credentials, API keys, and private certificates.

### 5.1 Hardcoded Secrets
- **Audited Codebase**: No production credentials (Cloudinary secret keys, database connection strings, or SMTP passwords) are hardcoded in the source code files. They are managed through environment variables (`.env`).
- **Startup Checks**: The application implements fail-fast checks at startup to verify that required environment variables are defined, preventing runtime failures.

### 5.2 Seeding Configuration
- **Vulnerability**: The database seed script [seed.ts](file:///c:/Users/Admin/Desktop/LOS/LOS/Backend/prisma/seed.ts) creates default accounts with guessable passwords (`admin123`, `officer123`, `analyst123`, `approver123`).
- **Risk**: If this seed script is executed in a production environment, default accounts will be created with weak credentials.
- **Recommendation**: Update the seed script to read default admin credentials from environment variables, or force seeded users to change their passwords on their first login.

---

## 6. Vulnerability Scanning
Vulnerability Scanning evaluates the deployment environment, server configuration, and communications infrastructure.

### 6.1 Server & Protocol Infrastructure
- **Transport Security**: The application relies on external network configurations (like reverse proxies or cloud load balancers) to enforce SSL/TLS encryption. Ensure the server only accepts HTTPS connections (TLS 1.2 or TLS 1.3) and redirects all HTTP traffic to HTTPS.
- **Port Exposure**: In a production deployment, only ports 80 (redirected to 443) and 443 should be exposed to the public internet. Port 5432 (PostgreSQL) must be restricted to internal VPC traffic.

### 6.2 CORS Policy
- **Audited Code**: The CORS configuration in `index.ts` restricts access based on a regular expression:
  ```typescript
  const isLocalhostOrNetwork = 
    /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|10\.\d+\.\d+\.\d+):(3000|5000)$/.test(origin);
  ```
- **Analysis**: This regex allows any local network IP address on ports 3000 or 5000 to access the API. While appropriate for development environments, this broad CORS policy must be restricted in production.
- **Recommendation**: Update the CORS configuration to load allowed origin domains (e.g., `https://fortresslending.com`) from environment variables in production:
  ```typescript
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS'));
      }
    },
    credentials: true
  }));
  ```

---

## 7. Manual Penetration Testing
Manual Penetration Testing evaluates the system against business logic flaws, authorization bypasses, and privilege escalation vulnerabilities.

### 7.1 Business Logic Flaws & State Bypass
- **State Transition Guard**: The application enforces a strict state transition workflow using a state map in [workflow.ts](file:///c:/Users/Admin/Desktop/LOS/LOS/Backend/src/utils/workflow.ts).
- **Vulnerability**: A logical vulnerability exists in the transition to the `APPROVED` state. While the controller verifies that an assessment is completed before transitioning to `APPROVED`, there is no validation to ensure that the document verifications are marked as `VERIFIED` beforehand.
- **Risk**: An application can be transitioned to `APPROVED` and have an offer generated even if required documents (like PAN or Aadhaar scans) are in a `REJECTED` or `PENDING` state.
- **Recommendation**: Add a validation check in the `updateStatus` method of the loan service to ensure all uploaded documents have a status of `VERIFIED` before allowing the loan application status to transition to `APPROVED`.

### 7.2 Multi-Step Privilege Escalation
- **Role Isolation**: The API route guards correctly restrict endpoints by role. For example, a `LOAN_OFFICER` cannot trigger assessments or disbursements.
- **Risk**: The `userController.updateUser` endpoint allows updates to user profiles. If this endpoint does not validate whether a user is attempting to modify their own role, it could lead to privilege escalation.
- **Analysis**: The routing file `routes/index.ts` protects the user modification routes using the `requireRole([Role.SUPER_ADMIN])` middleware, preventing standard users from modifying roles.

---

## 8. Configuration & Compliance Audits
Compliance Audits evaluate application configurations against regulatory requirements and system hardening guidelines.

### 8.1 Error Handling & Information Disclosure
- **Vulnerability**: The global Express error handler [error.ts](file:///c:/Users/Admin/Desktop/LOS/LOS/Backend/src/middlewares/error.ts) returns the raw exception message to the client for unhandled errors:
  ```typescript
  const message = err.message || 'Internal Server Error';
  sendError(res, message, undefined, statusCode);
  ```
- **Risk**: If the database connection fails or a runtime exception occurs, Prisma or Postgres stack traces and query details could be returned to the client, exposing database structures and configurations to users.
- **Recommendation**: Update the error handler to return a generic message in production environments when the error is not a custom `AppError`:
  ```typescript
  const isProduction = process.env.NODE_ENV === 'production';
  const message = (err instanceof AppError) 
    ? err.message 
    : (isProduction ? 'Internal Server Error' : err.message);
  ```

### 8.2 CORS Configuration
- **Status**: The CORS policy allows any IP in the local network ranges (`192.168.x.x`, `172.16.x.x`, etc.) on ports 3000 and 5000. In production, this policy must be restricted to specific domain origins.

---

## Summary of Findings & Action Items

| Vulnerability / Risk | Severity | Category | Action Item |
| :--- | :---: | :--- | :--- |
| **PAN Masking Logic Discrepancy** | **Medium** | SAST | Modify `masking.ts` to exclude `Role.CREDIT_ANALYST` from viewing raw PANs. |
| **Deprecated PDF Library** | **Medium** | SCA | Replace `pdf-creator-node` with a modern library to eliminate PhantomJS dependencies. |
| **Missing API Rate Limiting** | **Medium** | DAST | Configure rate limits on public authentication and OTP endpoints. |
| **No Session Revocation Control** | **Medium** | API Security | Implement a token blacklist database using Redis to handle logouts securely. |
| **Missing Security Headers** | **Medium** | DAST | Integrate `helmet` middleware in `index.ts` to set secure HTTP headers. |
| **Verbose Error Handling** | **Medium** | Compliance | Restrict unhandled error details from being sent to the client in production. |
| **Broad Development CORS Regex** | **Low** | Configuration | Externalize CORS origins to environment variables in production. |
| **Seeded Default Credentials** | **Low** | Secret Scanning | Disable default seeding credentials in production environments. |
