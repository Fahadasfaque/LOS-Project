/**
 * @file offer.controller.ts
 * @description Controller mapping routing requests to OfferService credit workflows.
 */

import { Request, Response, NextFunction } from 'express';
import { offerService } from '../services/offer.service';
import { loanApplicationService } from '../services/loanApplication.service';
import { emailService } from '../services/email.service';
import { sendSuccess } from '../utils/response';

/**
 * Generate a loan offer.
 */
export async function generateOffer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const result = await offerService.generateOffer(userId, role, req.body);
    const app = await loanApplicationService.getApplicationById(req.body.applicationId, userId, req.user!.role);

    emailService.sendNotification({
      to: app.email, // Notify Customer
      subject: 'Loan Offer Generated',
      title: 'Offer Generated',
      customerName: app.applicantName,
      applicationNumber: app.applicationNumber,
      status: 'OFFER_GENERATED',
      actionTaken: `A loan offer of $${result.loanAmount} with ${result.interestRate}% interest rate has been generated for you.`,
      userId,
    });

    sendSuccess(res, 'Loan offer generated successfully', result, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Record customer acceptance for offer.
 */
export async function acceptOffer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const result = await offerService.acceptOffer(userId, role, req.body);
    const app = await loanApplicationService.getApplicationById(req.body.applicationId, userId, req.user!.role);

    emailService.sendNotification({
      to: 'approvers@fortressbanking.com', // Notify Approver
      subject: 'Loan Offer Accepted',
      title: 'Offer Accepted',
      customerName: app.applicantName,
      applicationNumber: app.applicationNumber,
      status: 'OFFER_ACCEPTED',
      actionTaken: 'The customer has accepted the loan offer.',
      userId,
    });

    sendSuccess(res, 'Customer acceptance recorded successfully', result);
  } catch (error) {
    next(error);
  }
}

/**
 * Record customer declining for offer.
 */
export async function declineOffer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const result = await offerService.declineOffer(userId, role, req.body);
    const app = await loanApplicationService.getApplicationById(req.body.applicationId, userId, req.user!.role);

    emailService.sendNotification({
      to: 'approvers@fortressbanking.com', // Notify Approver
      subject: 'Loan Offer Declined',
      title: 'Offer Declined',
      customerName: app.applicantName,
      applicationNumber: app.applicationNumber,
      status: 'OFFER_DECLINED',
      actionTaken: 'The customer has declined the loan offer.',
      userId,
    });

    sendSuccess(res, 'Customer declining of offer recorded successfully', result);
  } catch (error) {
    next(error);
  }
}
