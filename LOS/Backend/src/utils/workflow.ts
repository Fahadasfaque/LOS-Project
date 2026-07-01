/**
 * @file workflow.ts
 * @description State transition configuration for Loan Origination status pipelines.
 */

import { LoanStatus } from '@prisma/client';

/**
 * State transition validation map. Enforces strict linear progression.
 */
export const VALID_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['OFFER_GENERATED'],
  OFFER_GENERATED: ['OFFER_ACCEPTED', 'REJECTED'],
  OFFER_ACCEPTED: ['DISBURSED'],
  REJECTED: [],
  DISBURSED: [],
};

/**
 * Validates whether a requested transition from one status to another is permitted.
 * 
 * @param oldStatus Current application status, or null for initial creation
 * @param newStatus Requested target status
 * @returns boolean indicating if transition is valid
 */
export function isValidTransition(
  oldStatus: LoanStatus | null,
  newStatus: LoanStatus
): boolean {
  if (oldStatus === null) {
    // Initial status must be DRAFT
    return newStatus === 'DRAFT';
  }

  if (oldStatus === newStatus) {
    return true; // Self-transitions are allowed (no-ops)
  }

  const allowed = VALID_TRANSITIONS[oldStatus];
  return allowed ? allowed.includes(newStatus) : false;
}
