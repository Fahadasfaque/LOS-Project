/**
 * @file masking.ts
 * @description Role-based PII masking functions for compliance.
 */

import { Role } from '@prisma/client';

/**
 * Masks the Permanent Account Number (PAN) based on the requesting user's role.
 * - SUPER_ADMIN & LOAN_OFFICER: Full access.
 * - CREDIT_ANALYST & APPROVER: Masked access (reveals only the last 4 characters, e.g. ******1234).
 * 
 * @param pan Raw 10-character PAN string
 * @param role The role of the requesting user
 * @returns Masked or full PAN string
 */
export function maskPan(pan: string, role: Role): string {
  if (!pan) return '';

  if (role === Role.SUPER_ADMIN || role === Role.LOAN_OFFICER) {
    return pan;
  }

  // Mask all but the last 4 characters
  if (pan.length <= 4) {
    return '*'.repeat(pan.length);
  }

  return '*'.repeat(pan.length - 4) + pan.slice(-4);
}
