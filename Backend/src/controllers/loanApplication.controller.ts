/**
 * @file loanApplication.controller.ts
 * @description Controller mapping routing requests to LoanApplicationService workflows.
 */

import { Request, Response, NextFunction } from 'express';
import { loanApplicationService } from '../services/loanApplication.service';
import { emailService } from '../services/email.service';
import { sendSuccess } from '../utils/response';

/**
 * Handle new loan application creation.
 * 
 * @param req Request containing application data in the body
 * @param res Response returning the created LoanApplication details
 * @param next Express next callback
 */
export async function createApplication(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await loanApplicationService.createApplication(userId, req.body);
    sendSuccess(res, 'Loan application initialized in DRAFT status.', result, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle updates to draft applications.
 * 
 * @param req Request containing updated fields in body, and application ID in parameters
 * @param res Response returning updated details
 * @param next Express next callback
 */
export async function updateApplication(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const result = await loanApplicationService.updateApplication(userId, id, req.body);
    sendSuccess(res, 'Loan application details updated.', result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle fetching a single application's details.
 * Enforces role-based masking on sensitive PII (PAN).
 * 
 * @param req Request containing application ID parameter
 * @param res Response returning details
 * @param next Express next callback
 */
export async function getApplicationById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const id = req.params.id as string;
    const result = await loanApplicationService.getApplicationById(id, userId, role);
    sendSuccess(res, 'Loan application details retrieved.', result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle transition of draft applications to SUBMITTED state.
 * 
 * @param req Request containing application ID parameter
 * @param res Response returning updated application details
 * @param next Express next callback
 */
export async function submitApplication(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const result = await loanApplicationService.submitApplication(userId, id);

    emailService.sendNotification({
      to: result.email, // Customer notification
      subject: `We've received your loan application #${result.applicationNumber}.`,
      title: 'Application Submitted.',
      customerName: result.applicantName,
      applicationNumber: result.applicationNumber,
      status: 'SUBMITTED',
      actionTaken: 'Thank you for choosing Fortress Banking. Your application has been successfully received. Our credit team is currently reviewing your file, and we will update you shortly.',
      userId,
    });

    emailService.sendNotification({
      to: 'cursorgmail01@gmail.com', // Internal notification
      subject: `New Loan Assessment Assigned - App #${result.applicationNumber}.`,
      title: 'Assessment Assigned.',
      customerName: result.applicantName,
      applicationNumber: result.applicationNumber,
      status: 'SUBMITTED',
      actionTaken: `Loan application #${result.applicationNumber} (${result.applicantName}) has been assigned to your queue. Please complete the credit assessment within your standard SLA.`,
      userId,
    });

    sendSuccess(res, 'Loan application submitted for credit assessment.', result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle transition of application status (underwriting/approval flows).
 * 
 * @param req Request containing application ID parameter and target status in body
 * @param res Response returning updated details
 * @param next Express next callback
 */
export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { status } = req.body;
    const role = req.user!.role;
    const result = await loanApplicationService.updateStatus(userId, role, id, status);

    let notificationTitle = 'Application Status Updated.';
    let actionTaken = `The status of your loan application has been updated to ${status.replace('_', ' ')}.`;

    if (status === 'APPROVED' || status === 'REJECTED') {
      const isApproved = status === 'APPROVED';

      // Set customer-facing title and professional message
      notificationTitle = isApproved ? 'Application Approved.' : 'Application Status Update.';

      actionTaken = isApproved
        ? `Great news! Your loan application #${result.applicationNumber} has been approved. Your formal loan offer is now being finalized.`
        : `Thank you for your interest in Fortress Banking. After careful review of application #${result.applicationNumber}, we regret that we are unable to approve your request at this time. A detailed letter has been sent to your secure portal account.`;

      // Notify Customer
      emailService.sendNotification({
        to: result.email,
        subject: isApproved
          ? `Update: Your loan application #${result.applicationNumber} is Approved.`
          : `Update regarding your loan application #${result.applicationNumber}.`,
        title: notificationTitle,
        customerName: result.applicantName,
        applicationNumber: result.applicationNumber,
        status,
        actionTaken, 
        userId,
      });

      // Notify Loan Officer
      emailService.sendNotification({
        to: 'fahadasfaque7860@gmail.com',
        subject: `App #${result.applicationNumber} - ${status} (${result.applicantName}).`,
        title: notificationTitle,
        customerName: result.applicantName,
        applicationNumber: result.applicationNumber,
        status,
        actionTaken: `Application #${result.applicationNumber} for ${result.applicantName} has moved to terminal status: ${status}. No further manual underwriting is required for this phase.`,
        userId,
      });
    }

    sendSuccess(res, 'Loan application status updated successfully.', result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle list retrieve with search, filter, and pagination.
 * 
 * @param req Request containing query filters
 * @param res Response returning paginated list
 * @param next Express next callback
 */
export async function listApplications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const result = await loanApplicationService.listApplications(role, userId, req.query as any);
    sendSuccess(res, 'Loan applications retrieved.', result);
  } catch (error) {
    next(error);
  }
}
