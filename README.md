# Loan Origination System (LOS) MVP

An enterprise-grade, secure, and role-based Loan Origination System (LOS) MVP designed to automate the loan lifecycle from draft profiling to credit underwriting, offer generation, customer acceptance, and payout disbursement.

---

## 1. Technology Stack

### Backend
- **Core Platform**: Express (v5) & Node.js with TypeScript
- **Database ORM**: Prisma (v7.8 Client) with PostgreSQL (Neon Serverless adapter)
- **Security & Cryptography**: Bcryptjs (password hashing) and AES-256-GCM (data encryption at rest)
- **Interactive API Docs**: OpenAPI (Swagger UI) exposed at `/api-docs`
- **Payload Validation**: Zod validators matching routing request schemas

### Frontend
- **Core Framework**: Next.js (v15.5 App Router) with React 19
- **Aesthetic Styling**: Tailwind CSS, Vanilla CSS transitions, and Lucide React icons
- **Security & Session**: React Context Auth provider восстанавливающий JWT-session state

---

## 2. Configuration & Boot Verification

### Backend Environment Variables (`Backend/.env`)
Create a `.env` file inside the `Backend/` directory with the following variables:
```env
PORT=5000
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
JWT_SECRET="YOUR_SECURE_JWT_SECRET_STRING"
ENCRYPTION_KEY="64_CHAR_HEXADECIMAL_STRING_FOR_AES_256_GCM"
```
> [!IMPORTANT]
> The server performs a **fail-fast validation** on boot. If `DATABASE_URL`, `JWT_SECRET`, or `ENCRYPTION_KEY` is missing or if `ENCRYPTION_KEY` is not a 64-character hex string (representing 32 bytes), the application will log a configuration error and immediately exit.

### Frontend Environment Variables (`Frontend/.env.local`)
Create a `.env.local` file inside the `Frontend/` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
```

---

## 3. Installation & Getting Started

### 3.1 Setup Backend
1. Navigate to the backend folder:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Push database schema modifications and generate the Prisma Client types:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
4. Run the database seed script to register mock credentials:
   ```bash
   npm run prisma:seed
   ```
5. Start local server in development mode:
   ```bash
   npm run dev
   ```
   - API endpoints will be accessible at: `http://localhost:5000`
   - Interactive Swagger API Documentation hosted at: `http://localhost:5000/api-docs`

### 3.2 Setup Frontend
1. Open a new terminal window and navigate to the frontend folder:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch development server:
   ```bash
   npm run dev
   ```
   - Open browser page at: `http://localhost:3000`

---

## 4. Default Seed Authentication Credentials

The seed script creates the following active profiles for workflow simulation:

| Role | Username / Email | Password |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | `admin@los.com` | `admin123` |
| **LOAN_OFFICER** | `officer@los.com` | `officer123` |
| **CREDIT_ANALYST** | `analyst@los.com` | `analyst123` |
| **APPROVER** | `approver@los.com` | `approver123` |

---

## 5. Documentation Directory

All architectural blueprints, entity relation guides, security constraints, and walkthroughs are archived in the `docs/` folder:
- **Product Specifications**: [PRD.md](file:///c:/Users/Admin/Desktop/LOS/docs/PRD.md)
- **Database Schemas**: [DATABASE_SCHEMA.md](file:///c:/Users/Admin/Desktop/LOS/docs/DATABASE_SCHEMA.md)
- **API Spec Document**: [API_DOCUMENTATION.md](file:///c:/Users/Admin/Desktop/LOS/docs/API_DOCUMENTATION.md)
- **User Sequence Flows**: [USER_FLOW.md](file:///c:/Users/Admin/Desktop/LOS/docs/USER_FLOW.md)
- **Security Guide**: [SECURITY.md](file:///c:/Users/Admin/Desktop/LOS/docs/SECURITY.md)
- **Production Audit**: [FINAL_CODE_REVIEW.md](file:///c:/Users/Admin/Desktop/LOS/docs/FINAL_CODE_REVIEW.md)
