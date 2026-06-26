import { z } from 'zod';
import { Role, LoanStatus, DocumentStatus, LoanType, EmploymentType, DocumentType } from '@prisma/client';

/**
 * Zod schema for validating user login requests
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Must be a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
  }),
});

export const requestOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Must be a valid email address.'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Must be a valid email address.'),
    code: z.string().length(6, 'OTP must be exactly 6 digits.'),
  }),
});

/**
 * Zod schema for validating new user registration requests
 */
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Must be a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
    firstName: z.string().min(1, 'First name is required.'),
    lastName: z.string().min(1, 'Last name is required.'),
    role: z.nativeEnum(Role, {
      message: 'Role must be SUPER_ADMIN, LOAN_OFFICER, CREDIT_ANALYST, or APPROVER.',
    }),
  }),
});

/**
 * Zod schema for validating loan application creations
 */
export const createApplicationSchema = z.object({
  body: z.object({
    applicantName: z.string().min(1, 'Applicant name is required.'),
    email: z.string().email('Must be a valid email address.'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
    pan: z.string().length(10, 'PAN card number must be exactly 10 characters.').regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, 'Invalid PAN card format (expected: ABCDE1234F).'),
    loanType: z.nativeEnum(LoanType, {
      message: 'LoanType must be PERSONAL, HOME, AUTO, BUSINESS, or EDUCATION.',
    }),
    loanAmount: z.number().positive('Loan amount must be a positive number.'),
    monthlyIncome: z.number().positive('Monthly income must be a positive number.'),
    employmentType: z.nativeEnum(EmploymentType, {
      message: 'EmploymentType must be SALARIED, SELF_EMPLOYED, or BUSINESS_OWNER.',
    }),
  }),
});

/**
 * Zod schema for validating loan application updates
 */
export const updateApplicationSchema = z.object({
  body: z.object({
    applicantName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
    pan: z.string().length(10).regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, 'Invalid PAN card format').optional(),
    loanType: z.nativeEnum(LoanType).optional(),
    loanAmount: z.number().positive().optional(),
    monthlyIncome: z.number().positive().optional(),
    employmentType: z.nativeEnum(EmploymentType).optional(),
  }),
});

/**
 * Zod schema for validating application status transition updates
 */
export const updateStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(LoanStatus, {
      message: 'Status must be DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, or DISBURSED.',
    }),
  }),
});

/**
 * Zod schema for validating document upload metadata registrations
 */
export const uploadDocumentSchema = z.object({
  body: z.object({
    applicationId: z.string().uuid('Application ID must be a valid UUID.'),
    documentType: z.nativeEnum(DocumentType, {
      message: 'DocumentType must be PAN, AADHAAR, SALARY_SLIP, or BANK_STATEMENT.',
    }),
    fileName: z.string().min(1, 'File name is required.'),
  }),
});

/**
 * Zod schema for validating document status verification modifications
 */
export const updateDocumentStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(DocumentStatus, {
      message: 'Status must be PENDING, VERIFIED, or REJECTED.',
    }),
  }),
});

export type CreateUserType = z.infer<typeof createUserSchema>['body'];
export type CreateAppType = z.infer<typeof createApplicationSchema>['body'];

/**
 * Zod schema for validating credit assessment creations
 */
export const createAssessmentSchema = z.object({
  body: z.object({
    applicationId: z.string().uuid('Application ID must be a valid UUID.'),
    assessmentNotes: z.string().min(1, 'Assessment notes are required.'),
  }),
});

/**
 * Zod schema for validating offer generation requests
 */
export const generateOfferSchema = z.object({
  body: z.object({
    applicationId: z.string().uuid('Application ID must be a valid UUID.'),
    interestRate: z.number().positive('Interest rate must be a positive number.'),
    tenureMonths: z.number().int().positive('Tenure must be a positive integer.'),
  }),
});

/**
 * Zod schema for validating offer acceptance / customer acceptance requests
 */
export const acceptOfferSchema = z.object({
  body: z.object({
    applicationId: z.string().uuid('Application ID must be a valid UUID.'),
  }),
});

/**
 * Zod schema for validating loan disbursement requests
 */
export const disburseLoanSchema = z.object({
  body: z.object({
    applicationId: z.string().uuid('Application ID must be a valid UUID.'),
  }),
});

