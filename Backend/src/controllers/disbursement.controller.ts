/**
 * @file disbursement.controller.ts
 * @description Controller mapping routing requests to DisbursementService transaction executions.
 */

import { Request, Response, NextFunction } from 'express';
import { disbursementService } from '../services/disbursement.service';
import { loanApplicationService } from '../services/loanApplication.service';
import { emailService } from '../services/email.service';
import { sendSuccess } from '../utils/response';

/**
 * Perform disbursement transaction.
 */
export async function disburseLoan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const result = await disbursementService.disburseLoan(userId, role, req.body);
    const app = await loanApplicationService.getApplicationById(req.body.applicationId, userId, req.user!.role);

    emailService.sendNotification({
      to: app.email, // Notify Customer
      subject: 'Loan Disbursed',
      title: 'Disbursement Completed',
      customerName: app.applicantName,
      applicationNumber: app.applicationNumber,
      status: 'DISBURSED',
      transactionId: result.referenceNumber,
      actionTaken: `Your loan of $${result.amount} has been successfully disbursed.`,
      userId,
    });

    sendSuccess(res, 'Loan disbursed successfully', result, 201);
  } catch (error) {
    next(error);
  }
}
