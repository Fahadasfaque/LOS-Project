/**
 * @file customerStatusMap.ts
 * @description Maps internal LoanStatus enum values to customer-friendly labels.
 *
 * BUSINESS RULE: Customers NEVER see raw internal workflow state names.
 * Internal states like UNDER_REVIEW, OFFER_GENERATED are bank-operational jargon.
 * This utility provides the translation layer for all customer-facing UI.
 */

export type LoanStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'OFFER_GENERATED'
  | 'OFFER_ACCEPTED'
  | 'REJECTED'
  | 'DISBURSED';

export interface CustomerStatusInfo {
  /** The label shown in the customer portal */
  label: string;
  /** Short description for the progress tracker */
  description: string;
  /** Step number in the progress tracker (null = not shown in linear flow) */
  step: number | null;
  /** Color semantic for badges and indicators */
  color: 'blue' | 'amber' | 'green' | 'red' | 'purple';
  /** Icon key for rendering */
  icon: 'clock' | 'check' | 'file' | 'search' | 'gift' | 'thumbsup' | 'money' | 'x';
}

export const CUSTOMER_STATUS_MAP: Record<LoanStatus, CustomerStatusInfo> = {
  DRAFT: {
    label: 'Application In Progress',
    description: 'Your application is being prepared.',
    step: null,
    color: 'amber',
    icon: 'clock',
  },
  SUBMITTED: {
    label: 'Application Received',
    description: 'Your application has been submitted and received by the bank.',
    step: 1,
    color: 'blue',
    icon: 'check',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    description: 'Our team is reviewing your application and documents.',
    step: 2,
    color: 'blue',
    icon: 'search',
  },
  APPROVED: {
    label: 'Assessment Complete',
    description: 'Your application has cleared the credit assessment.',
    step: 3,
    color: 'green',
    icon: 'check',
  },
  OFFER_GENERATED: {
    label: 'Offer Ready',
    description: 'Your loan offer is ready. Please review and respond.',
    step: 4,
    color: 'purple',
    icon: 'gift',
  },
  OFFER_ACCEPTED: {
    label: 'Offer Accepted',
    description: 'You have accepted the offer. Disbursement is in progress.',
    step: 5,
    color: 'green',
    icon: 'thumbsup',
  },
  DISBURSED: {
    label: 'Funds Disbursed',
    description: 'Loan funds have been transferred to your account.',
    step: 6,
    color: 'green',
    icon: 'money',
  },
  REJECTED: {
    label: 'Application Closed',
    description: 'Your application has been closed. Please contact your Loan Officer.',
    step: null,
    color: 'red',
    icon: 'x',
  },
};

/** Ordered list of progress tracker steps (excluding DRAFT and REJECTED) */
export const PROGRESS_STEPS: Array<{ status: LoanStatus; label: string; step: number }> = [
  { status: 'SUBMITTED', label: 'Application Received', step: 1 },
  { status: 'UNDER_REVIEW', label: 'Under Review', step: 2 },
  { status: 'APPROVED', label: 'Assessment Complete', step: 3 },
  { status: 'OFFER_GENERATED', label: 'Offer Ready', step: 4 },
  { status: 'OFFER_ACCEPTED', label: 'Offer Accepted', step: 5 },
  { status: 'DISBURSED', label: 'Funds Disbursed', step: 6 },
];

/**
 * Get the customer-friendly info for a given internal status.
 */
export function getCustomerStatus(status: string): CustomerStatusInfo {
  return (
    CUSTOMER_STATUS_MAP[status as LoanStatus] || {
      label: 'Processing',
      description: 'Your application is being processed.',
      step: null,
      color: 'blue' as const,
      icon: 'clock' as const,
    }
  );
}

/**
 * Get the current step number for a given status.
 * Returns 0 if the status has no step.
 */
export function getCurrentStep(status: string): number {
  return CUSTOMER_STATUS_MAP[status as LoanStatus]?.step ?? 0;
}

/**
 * Check if a step is completed relative to the current status.
 */
export function isStepCompleted(stepStatus: LoanStatus, currentStatus: LoanStatus): boolean {
  const stepNum = CUSTOMER_STATUS_MAP[stepStatus]?.step ?? 0;
  const currentNum = CUSTOMER_STATUS_MAP[currentStatus]?.step ?? 0;
  return stepNum < currentNum;
}

/**
 * Check if a step is the current active step.
 */
export function isStepCurrent(stepStatus: LoanStatus, currentStatus: LoanStatus): boolean {
  return stepStatus === currentStatus;
}

/**
 * Format Indian currency (₹).
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format loan type for customer display.
 */
export function formatLoanType(loanType: string): string {
  const map: Record<string, string> = {
    PERSONAL: 'Personal Loan',
    HOME: 'Home Loan',
    AUTO: 'Auto Loan',
    BUSINESS: 'Business Loan',
    EDUCATION: 'Education Loan',
  };
  return map[loanType] || loanType;
}

/**
 * Format employment type for customer display.
 */
export function formatEmploymentType(type: string): string {
  const map: Record<string, string> = {
    SALARIED: 'Salaried',
    SELF_EMPLOYED: 'Self Employed',
    BUSINESS_OWNER: 'Business Owner',
  };
  return map[type] || type;
}

/**
 * Calculate days remaining until offer expiry.
 */
export function getDaysUntilExpiry(expiresAt: string | Date): number {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Group notifications by date (Today, Yesterday, Earlier).
 */
export function groupNotificationsByDate<T extends { createdAt: string | Date }>(
  notifications: T[]
): { today: T[]; yesterday: T[]; earlier: T[] } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return notifications.reduce(
    (acc, notif) => {
      const notifDate = new Date(notif.createdAt);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDay.getTime() === today.getTime()) {
        acc.today.push(notif);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        acc.yesterday.push(notif);
      } else {
        acc.earlier.push(notif);
      }

      return acc;
    },
    { today: [] as T[], yesterday: [] as T[], earlier: [] as T[] }
  );
}
