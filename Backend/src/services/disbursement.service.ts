/**
 * @file disbursement.service.ts
 * @description Coordinate loan Disbursement checks and transaction records.
 */

import { disbursementRepository } from '../repositories/disbursement.repository';
import { LoanApplicationRepository } from '../repositories/loanApplication.repository';
import { auditLogService } from './auditLog.service';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { Disbursement, DisbursementStatus, Role } from '@prisma/client';

export class DisbursementService {
  private repository = disbursementRepository;
  private appRepository = new LoanApplicationRepository();

  /**
   * Executes a loan disbursement transaction.
   * Restrict to APPROVER or SUPER_ADMIN.
   * 
   * @param userId The ID of the authenticated user
   * @param role The role of the user
   * @param data Payload containing applicationId
   */
  async disburseLoan(
    userId: string,
    role: Role,
    data: { applicationId: string }
  ): Promise<Disbursement> {
    // 1. Enforce Role restriction (APPROVER or SUPER_ADMIN only)
    if (role !== Role.SUPER_ADMIN && role !== Role.APPROVER) {
      throw new ForbiddenError('Access denied: Only Approvers or Super Admins can disburse loans.');
    }

    // 2. Fetch Application
    const app = await this.appRepository.findById(data.applicationId);
    if (!app) {
      throw new NotFoundError('Loan application not found');
    }

    // 3. Verify status is OFFER_ACCEPTED
    if (app.status !== 'OFFER_ACCEPTED') {
      throw new BadRequestError('Loans can only be disbursed if the offer has been ACCEPTED.');
    }

    // 4. Generate transaction reference: TXN-YYYYMMDD-XXXXXX
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const randomHex = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    const referenceNumber = `TXN-${year}${month}${date}-${randomHex}`;

    // 5. Create Disbursement record
    const disbursement = await this.repository.create({
      applicationId: data.applicationId,
      amount: app.loanAmount,
      referenceNumber,
      status: DisbursementStatus.SUCCESS,
      disbursedById: userId,
    });

    // 6. Transition application status to DISBURSED
    await this.appRepository.updateStatusWithHistory(
      data.applicationId,
      app.status,
      'DISBURSED',
      userId
    );

    // 7. Log Audit event: LOAN_DISBURSED
    await auditLogService.logAction(
      userId,
      'LOAN_DISBURSED',
      `Disbursed loan amount ${app.loanAmount} for application ${app.applicationNumber}. Ref: ${referenceNumber}`
    );

    return disbursement;
  }
}

export const disbursementService = new DisbursementService();
