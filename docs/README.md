# LOS Documentation

Welcome to the Loan Origination System (LOS) documentation directory. This folder contains all the architectural blueprints, product specifications, security guidelines, and design documents required to understand and maintain the LOS platform.

## Table of Contents

- [**PRD.md**](file:///c:/Users/Admin/Desktop/LOS/docs/PRD.md)
  The Product Requirements Document detailing the core features, user roles (SUPER_ADMIN, LOAN_OFFICER, CREDIT_ANALYST, APPROVER), and capabilities of the MVP.
  
- [**ARCHITECTURE.md**](file:///c:/Users/Admin/Desktop/LOS/docs/ARCHITECTURE.md)
  A high-level view of the system architecture. Explains the backend design patterns (Controller → Service → Repository), data protection strategies, and frontend integration approaches.

- [**DATABASE_SCHEMA.md**](file:///c:/Users/Admin/Desktop/LOS/docs/DATABASE_SCHEMA.md)
  Comprehensive overview of the PostgreSQL database schema managed by Prisma. It documents key tables such as Users, LoanApplications, Assessments, and AuditLogs.

- [**API_DOCUMENTATION.md**](file:///c:/Users/Admin/Desktop/LOS/docs/API_DOCUMENTATION.md)
  Details on the REST endpoints provided by the backend Express server, including request payloads, responses, and the required JWT authorization scopes.

- [**USER_FLOW.md**](file:///c:/Users/Admin/Desktop/LOS/docs/USER_FLOW.md)
  Sequence diagrams and state transitions demonstrating how applications move from DRAFT to DISBURSED, and the roles responsible for each transition.

- [**SECURITY.md**](file:///c:/Users/Admin/Desktop/LOS/docs/SECURITY.md)
  An in-depth guide on the security constraints implemented within the system, such as AES-256-GCM encryption for PII, bcrypt password hashing, and role-based access control strategies.
