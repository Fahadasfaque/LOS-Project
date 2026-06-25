# API Documentation - Loan Origination System (LOS)

This document details the REST API specifications for the Loan Origination System (LOS) v1.

---

## 1. Authentication Endpoints

### 1.1 User Login
Authenticates user and returns JWT session token.

- **URL**: `/api/v1/auth/login`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "email": "loanofficer@fortress.com",
    "password": "Password@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "e44d3208-8e6f-4c8d-8a6e-399d8b746c10",
        "email": "loanofficer@fortress.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "LOAN_OFFICER"
      }
    }
  }
  ```

---

### 1.2 Get Self Profile
Retrieves the logged-in user profile from active JWT session header.

- **URL**: `/api/v1/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User session active",
    "data": {
      "user": {
        "id": "e44d3208-8e6f-4c8d-8a6e-399d8b746c10",
        "email": "loanofficer@fortress.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "LOAN_OFFICER"
      }
    }
  }
  ```

---

## 2. Loan Application Endpoints

### 2.1 Create Loan Application (Draft)
Initiates a new loan application. Restrictive to `LOAN_OFFICER` and `SUPER_ADMIN`.

- **URL**: `/api/v1/applications`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "applicantName": "Rahul Sharma",
    "email": "rahul@example.com",
    "phone": "9876543210",
    "pan": "ABCDE1234F",
    "loanType": "PERSONAL",
    "loanAmount": 500000,
    "monthlyIncome": 85000,
    "employmentType": "SALARIED"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Loan application initialized in DRAFT status",
    "data": {
      "id": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
      "applicationNumber": "LOS-2026-000001",
      "applicantName": "Rahul Sharma",
      "status": "DRAFT",
      "createdAt": "2026-06-24T18:11:12.000Z"
    }
  }
  ```

---

### 2.2 List Loan Applications
Retrieves paginated, filtered applications list. Enforces RBAC visibility rules:
- `LOAN_OFFICER` only views applications created by their own user ID.
- `CREDIT_ANALYST`, `APPROVER`, and `SUPER_ADMIN` view all entries.

- **URL**: `/api/v1/applications`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `search` (Optional): Filter by applicant name, app number, or email
  - `status` (Optional): Filter by status (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, etc.)
  - `loanType` (Optional): Filter by loan type (`PERSONAL`, `HOME`, etc.)
  - `page` (Optional, Default `1`): Page number
  - `limit` (Optional, Default `10`): Items count per page
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Loan applications retrieved",
    "data": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "items": [
        {
          "id": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
          "applicationNumber": "LOS-2026-000001",
          "applicantName": "Rahul Sharma",
          "email": "rahul@example.com",
          "phone": "9876543210",
          "pan": "ABCDE1234F",
          "loanType": "PERSONAL",
          "loanAmount": 500000,
          "status": "DRAFT",
          "createdAt": "2026-06-24T18:11:12.000Z"
        }
      ]
    }
  }
  ```

---

### 2.3 Get Application Details
Retrieves full details of a single application case. Enforces role-based sensitive PII masking on the `pan` field:
- `SUPER_ADMIN`, `LOAN_OFFICER`: Full PAN visibility (unmasked e.g. `ABCDE1234F`)
- `CREDIT_ANALYST`, `APPROVER`: Masked PAN visibility (e.g. `••••••234F` or `*****`)

- **URL**: `/api/v1/applications/:id`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Loan application details retrieved",
    "data": {
      "id": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
      "applicationNumber": "LOS-2026-000001",
      "applicantName": "Rahul Sharma",
      "email": "rahul@example.com",
      "phone": "9876543210",
      "pan": "ABCDE1234F",
      "loanType": "PERSONAL",
      "loanAmount": 500000,
      "monthlyIncome": 85000,
      "employmentType": "SALARIED",
      "status": "DRAFT",
      "documents": [],
      "statusHistory": [
        {
          "id": "d11b8208-8e6f-4c8d-8a6e-399d8b746c30",
          "oldStatus": null,
          "newStatus": "DRAFT",
          "changedAt": "2026-06-24T18:11:12.000Z",
          "changedBy": {
            "firstName": "John",
            "lastName": "Doe",
            "role": "LOAN_OFFICER"
          }
        }
      ]
    }
  }
  ```

---

### 2.4 Update Application Draft
Modifies draft loan details. Allowed only while application is in `DRAFT` status.

- **URL**: `/api/v1/applications/:id`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "loanAmount": 600000,
    "monthlyIncome": 90000
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Loan application details updated",
    "data": {
      "id": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
      "loanAmount": 600000,
      "status": "DRAFT"
    }
  }
  ```

---

### 2.5 Submit Application
Transitions application status from `DRAFT` to `SUBMITTED`. Triggers StatusHistory entry and Audit Log creation.

- **URL**: `/api/v1/applications/:id/submit`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Loan application submitted for credit assessment",
    "data": {
      "id": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
      "applicationNumber": "LOS-2026-000001",
      "status": "SUBMITTED"
    }
  }
  ```

---

### 2.6 Change Status
General workflow transition (e.g. Underwriting starts, Approver signs off). Valid transitions:
- `SUBMITTED` -> `UNDER_REVIEW` (Analyst starts check)
- `UNDER_REVIEW` -> `APPROVED` or `REJECTED` (Analyst/Approver check complete)
- `APPROVED` -> `DISBURSED` (Final payout)

- **URL**: `/api/v1/applications/:id/status`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "status": "UNDER_REVIEW"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Loan application status updated successfully",
    "data": {
      "id": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
      "status": "UNDER_REVIEW"
    }
  }
  ```

---

## 3. Document Registry Endpoints

### 3.1 Register Uploaded Document
Creates a document record under the application and uploads the file to Cloudinary. Restricted to `LOAN_OFFICER` and `SUPER_ADMIN`.

- **URL**: `/api/v1/documents`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Payload** (FormData):
  - `applicationId`: string (UUID)
  - `documentType`: string (`PAN` | `AADHAAR` | `SALARY_SLIP` | `BANK_STATEMENT`)
  - `file`: File (Binary data, max 10MB)

- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Document reference uploaded successfully",
    "data": {
      "id": "b33c8208-8e6f-4c8d-8a6e-399d8b746c40",
      "applicationId": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
      "documentType": "PAN",
      "originalName": "pan_scan.pdf",
      "publicId": "LOS/LOS-2026-000001/PAN_timestamp",
      "secureUrl": "https://res.cloudinary.com/demo/image/upload/v12345/LOS/LOS-2026-000001/PAN_timestamp.pdf",
      "status": "PENDING",
      "uploadedAt": "2026-06-24T18:13:00.000Z"
    }
  }
  ```

---

### 3.1.5 Delete Document
Deletes a document from both Cloudinary and the local database. Restricted to `LOAN_OFFICER` and `SUPER_ADMIN`.

- **URL**: `/api/v1/documents/:publicId`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Document deleted successfully"
  }
  ```

---

### 3.2 Verify/Reject Document
Updates verification status. Restricted to `CREDIT_ANALYST` and `SUPER_ADMIN`.

- **URL**: `/api/v1/documents/:id/status`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "status": "VERIFIED"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Document verification status updated",
    "data": {
      "id": "b33c8208-8e6f-4c8d-8a6e-399d8b746c40",
      "status": "VERIFIED"
    }
  }
  ```

---

## 4. Credit Assessment Endpoints

### 4.1 Create/Complete Credit Assessment
Calculates credit score, risk, and recommendation, and registers completed assessment. Restricted to `CREDIT_ANALYST` and `SUPER_ADMIN`.
- **URL**: `/api/v1/assessments`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "applicationId": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
    "assessmentNotes": "Income verified, PAN scanned successfully. Low risk parameters met."
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Credit assessment completed and saved successfully",
    "data": {
      "id": "c11d8208-8e6f-4c8d-8a6e-399d8b746c50",
      "applicationId": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
      "status": "COMPLETED",
      "creditScore": 780,
      "riskLevel": "LOW",
      "recommendation": "APPROVE",
      "assessmentNotes": "Income verified, PAN scanned successfully. Low risk parameters met.",
      "assessedById": "e44d3208-8e6f-4c8d-8a6e-399d8b746c10",
      "assessedAt": "2026-06-24T18:15:00.000Z"
    }
  }
  ```

---

### 4.2 Get Assessment by Application ID
Retrieves details of the assessment for a specific loan application. Accessible to `CREDIT_ANALYST`, `APPROVER`, and `SUPER_ADMIN`.
- **URL**: `/api/v1/assessments/:applicationId`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Credit assessment retrieved successfully",
    "data": {
      "id": "c11d8208-8e6f-4c8d-8a6e-399d8b746c50",
      "applicationId": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
      "status": "COMPLETED",
      "creditScore": 780,
      "riskLevel": "LOW",
      "recommendation": "APPROVE",
      "assessmentNotes": "Income verified, PAN scanned successfully. Low risk parameters met.",
      "assessedById": "e44d3208-8e6f-4c8d-8a6e-399d8b746c10",
      "assessedBy": {
        "id": "e44d3208-8e6f-4c8d-8a6e-399d8b746c10",
        "email": "analyst@los.com",
        "firstName": "Alice",
        "lastName": "Smith",
        "role": "CREDIT_ANALYST"
      },
      "assessedAt": "2026-06-24T18:15:00.000Z"
    }
  }
  ```

---

## 5. Offer & Disbursement Endpoints

### 5.1 Generate Loan Offer
Generates annual interest rate, tenure, and calculates standard EMI schedule. Restricted to `APPROVER` and `SUPER_ADMIN`.
- **URL**: `/api/v1/offers/generate`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "applicationId": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
    "interestRate": 10.5,
    "tenureMonths": 36
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Loan offer generated successfully",
    "data": {
      "id": "o22e8208-8e6f-4c8d-8a6e-399d8b746c60",
      "applicationId": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
      "loanAmount": 500000,
      "interestRate": 10.5,
      "tenureMonths": 36,
      "emiAmount": 16251.27,
      "offerStatus": "GENERATED",
      "generatedAt": "2026-06-25T10:11:00.000Z",
      "expiresAt": "2026-07-02T10:11:00.000Z"
    }
  }
  ```

---

### 5.2 Record Customer Acceptance
Records client approval signature of terms. Restricted to `LOAN_OFFICER` and `SUPER_ADMIN`.
- **URL**: `/api/v1/offers/accept`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "applicationId": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Customer acceptance recorded successfully",
    "data": {
      "id": "o22e8208-8e6f-4c8d-8a6e-399d8b746c60",
      "offerStatus": "ACCEPTED",
      "acceptedAt": "2026-06-25T10:15:00.000Z"
    }
  }
  ```

---

### 5.3 Record Customer Declination
Records customer declining the generated terms. Restricted to `LOAN_OFFICER` and `SUPER_ADMIN`.
- **URL**: `/api/v1/offers/decline`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "applicationId": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Customer declining of offer recorded successfully",
    "data": {
      "id": "o22e8208-8e6f-4c8d-8a6e-399d8b746c60",
      "offerStatus": "DECLINED"
    }
  }
  ```

---

### 5.4 Execute Loan Disbursement
Releases approved principal limit and logs payout txn clearance ref. Restricted to `APPROVER` and `SUPER_ADMIN`.
- **URL**: `/api/v1/disbursements`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "applicationId": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Funds disbursed successfully",
    "data": {
      "id": "d33f8208-8e6f-4c8d-8a6e-399d8b746c70",
      "applicationId": "f55c8208-8e6f-4c8d-8a6e-399d8b746c20",
      "amount": 500000,
      "referenceNumber": "TXN-20260625-983174",
      "status": "SUCCESS",
      "disbursedById": "e44d3208-8e6f-4c8d-8a6e-399d8b746c10",
      "disbursedAt": "2026-06-25T10:20:00.000Z"
    }
  }
  ```
