/**
 * @file auditLog.service.ts
 * @description Coordinates writing and reading database audit logs.
 * 
 * BUSINESS CONTEXT:
 * Loan Origination Systems handle high-value credit allocations and sensitive data queries.
 * Audit logs are legally required under financial services regulations (e.g. Basel III, SOX, local banking rules).
 * An immutable ledger of actions serves to:
 * 1. Fraud Prevention: Detect unauthorized profile changes or credit reviews.
 * 2. Compliance: Show auditors who accessed what records, when, and from which IP.
 * 3. Diagnostic Trace: Troubleshoot lifecycle transaction steps.
 */

import { AuditLogRepository } from '../repositories/auditLog.repository';

export class AuditLogService {
  private auditLogRepository = new AuditLogRepository();

  /**
   * Writes a new compliance/audit trail record in the database.
   * 
   * @param userId The ID of the authenticated user performing the action, or undefined if system-triggered
   * @param action Short identifier code representing the event (e.g., 'USER_LOGIN', 'USER_CREATION')
   * @param details Human-readable descriptive explanation / metadata
   * @param ipAddress The IP address of the client triggering the request
   * @returns The saved AuditLog database object
   */
  async logAction(
    userId: string | undefined,
    action: string,
    details: string,
    ipAddress?: string
  ) {
    return this.auditLogRepository.create({
      userId,
      action,
      details,
      ipAddress,
    });
  }

  /**
   * Retrieves all system audit logs.
   * Only accessible by SUPER_ADMIN.
   * 
   * @returns Array of audit log records including triggered user profile information
   */
  async getAllLogs() {
    return this.auditLogRepository.findAll();
  }
}

export const auditLogService = new AuditLogService();
