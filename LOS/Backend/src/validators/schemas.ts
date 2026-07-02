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
    forceNew: z.boolean().optional(),
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
      message: 'Role must be SUPER_ADMIN, LOAN_OFFICER, CREDIT_ANALYST, APPROVER, or CUSTOMER.',
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
    pan: z.string().length(10).regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, 'Invalid PAN card format.').optional(),
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

export const bulkCreateUserSchema = z.object({
  body: z.array(
    z.object({
      email: z.string().email('Must be a valid email address.'),
      password: z.string().min(6, 'Password must be at least 6 characters long.'),
      firstName: z.string().min(1, 'First name is required.'),
      lastName: z.string().min(1, 'Last name is required.'),
      role: z.nativeEnum(Role, {
        message: 'Role must be SUPER_ADMIN, LOAN_OFFICER, CREDIT_ANALYST, APPROVER, or CUSTOMER.',
      }),
    })
  ).min(1, 'At least one user must be provided.'),
});

export const bulkCreateApplicationSchema = z.object({
  body: z.array(
    z.object({
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
    })
  ).min(1, 'At least one application must be provided.'),
});


// ─── Settings Schemas ────────────────────────────────────────────────────────

/**
 * Profile update — only firstName and lastName are editable; email is locked.
 */
export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(1, 'First name is required.')
      .max(50, 'First name must not exceed 50 characters.')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes.')
      .optional(),
    lastName: z
      .string()
      .max(50, 'Last name must not exceed 50 characters.')
      .regex(/^[a-zA-Z\s'-]*$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes.')
      .optional(),
  }).refine((data) => data.firstName !== undefined || data.lastName !== undefined, {
    message: 'At least one of firstName or lastName must be provided.',
  }),
});

/**
 * Password change — requires current password, new password (min 8 chars, complexity rules).
 * Confirm-password check is handled on the frontend; backend only needs the two values.
 */
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters.')
      .max(128, 'Password must not exceed 128 characters.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.'),
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password.',
    path: ['newPassword'],
  }),
});

/**
 * User notification preferences — only the emailNotifications boolean toggle.
 */
export const updateNotificationPrefsSchema = z.object({
  body: z.object({
    emailNotifications: z.boolean({ error: 'emailNotifications must be a boolean.' }),
  }),
});

/**
 * Global email service toggle — SUPER_ADMIN only; just a boolean enabled flag.
 */
export const setEmailServiceStatusSchema = z.object({
  body: z.object({
    enabled: z.boolean({ error: 'enabled must be a boolean.' }),
  }),
});
