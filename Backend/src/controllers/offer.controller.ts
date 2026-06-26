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
      subject: `Your loan offer is ready for review - App #${app.applicationNumber}.`,
      title: 'Offer Generated.',
      customerName: app.applicantName,
      applicationNumber: app.applicationNumber,
      status: 'OFFER_GENERATED',
      actionTaken: `We are pleased to present a personalized loan offer of $${result.loanAmount} at a fixed interest rate of ${result.interestRate}%. Please Contect you Loan Officer.`,
      userId,
    });

    sendSuccess(res, 'Loan offer generated successfully.', result, 201);
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
      to: 'fahadasfaque@gmail.com', // Notify Approver
      subject: `[Offer Accepted] Processing Disbursal for ${app.applicantName} (${app.applicationNumber}).`,
      title: 'Offer Accepted.',
      customerName: app.applicantName,
      applicationNumber: app.applicationNumber,
      status: 'OFFER_ACCEPTED',
      actionTaken: `The customer (${app.applicantName}) has digitally accepted the loan agreement for App #${app.applicationNumber}. This file has been queued for final verification and fund disbursement.`,
      userId,
    });

    sendSuccess(res, 'Customer acceptance recorded successfully.', result);
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
      to: 'fahadasfaque@gmail.com', // Notify Approver
      subject: `[Offer Declined] Application File Closed - App #${app.applicationNumber}.`,
      title: 'Offer Declined.',
      customerName: app.applicantName,
      applicationNumber: app.applicationNumber,
      status: 'OFFER_DECLINED',
      actionTaken: `The loan offer for App #${app.applicationNumber} was declined by the customer. The application file has been closed out in the system automatically.`,
      userId,
    });

    sendSuccess(res, 'Customer declining of offer recorded successfully.', result);
  } catch (error) {
    next(error);
  }
}
