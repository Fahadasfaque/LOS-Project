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
    sendSuccess(res, 'Loan application initialized in DRAFT status', result, 201);
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
    sendSuccess(res, 'Loan application details updated', result);
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
    sendSuccess(res, 'Loan application details retrieved', result);
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
      subject: 'Loan Application Submitted',
      title: 'Application Submitted',
      customerName: result.applicantName,
      applicationNumber: result.applicationNumber,
      status: 'SUBMITTED',
      actionTaken: 'Your application has been successfully submitted and is under review.',
      userId,
    });

    emailService.sendNotification({
      to: 'credit-team@fortressbanking.com', // Internal notification
      subject: 'New Loan Application Assigned',
      title: 'Assessment Assigned',
      customerName: result.applicantName,
      applicationNumber: result.applicationNumber,
      status: 'SUBMITTED',
      actionTaken: 'A new loan application requires your credit assessment.',
      userId,
    });

    sendSuccess(res, 'Loan application submitted for credit assessment', result);
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

    let notificationTitle = 'Application Status Updated';
    let actionTaken = `The status of the application was updated to ${status}.`;

    if (status === 'APPROVED' || status === 'REJECTED') {
      notificationTitle = `Loan ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`;
      actionTaken = `The loan application has been ${status.toLowerCase()} by the approver.`;
      
      // Notify Customer
      emailService.sendNotification({
        to: result.email,
        subject: `Loan Application ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        title: notificationTitle,
        customerName: result.applicantName,
        applicationNumber: result.applicationNumber,
        status,
        actionTaken,
        userId,
      });

      // Notify Loan Officer
      emailService.sendNotification({
        to: 'loan-officers@fortressbanking.com',
        subject: `Application ${status}`,
        title: notificationTitle,
        customerName: result.applicantName,
        applicationNumber: result.applicationNumber,
        status,
        actionTaken,
        userId,
      });
    }

    sendSuccess(res, 'Loan application status updated successfully', result);
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
    sendSuccess(res, 'Loan applications retrieved', result);
  } catch (error) {
    next(error);
  }
}
