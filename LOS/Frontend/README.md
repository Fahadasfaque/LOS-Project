# LOS Frontend

This is the Next.js frontend client for the Loan Origination System (LOS). It provides a secure, role-based web interface for SUPER_ADMIN, LOAN_OFFICER, CREDIT_ANALYST, and APPROVER roles to interact with the LOS backend API.

## Tech Stack

- **Core Framework**: Next.js 15 (App Router) with React 19
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI (with Lucide React icons)
- **State Management**: React Context (`AuthContext` for session management)

## Getting Started

### 1. Configure Environment Variables

Create a `.env.local` file in the root of the `Frontend` directory with the following variable, pointing to your backend server instance:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the login page.

## Project Structure

- `src/app/`: Next.js App Router pages (Dashboard, Login, etc.)
- `src/components/`: Reusable React components (Layouts, UI primitives)
- `src/context/`: React Context providers (AuthContext)
- `src/lib/`: Utility functions and helpers
- `src/services/`: API integration services
- `public/`: Static assets (images, icons)

## Architecture Notes

- **Authentication**: Stateless JWT tokens are stored and attached to all API requests via the `api.ts` service wrapper. Unauthenticated access is routed back to `/login`.
- **Role-Based Navigation**: The layout sidebar dynamically renders navigation links based on the authenticated user's role.

