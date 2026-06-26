/**
 * @file assessment.controller.ts
 * @description Controller mapping routing requests to AssessmentService credit workflows.
 */

import { Request, Response, NextFunction } from 'express';
import { assessmentService } from '../services/assessment.service';
import { loanApplicationService } from '../services/loanApplication.service';
import { emailService } from '../services/email.service';
import { sendSuccess } from '../utils/response';

/**
 * Handle new credit assessment execution and note saving.
 * 
 * @param req Request containing applicationId and assessmentNotes in body
 * @param res Response returning the completed Assessment details
 * @param next Express next callback
 */
export async function createAssessment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await assessmentService.createAssessment(userId, req.body);
    const app = await loanApplicationService.getApplicationById(req.body.applicationId, userId, req.user!.role);

    emailService.sendNotification({
      to: 'fahadasfaque@gmail.com', // Internal notification for Approvers
      subject: `Assessment Completed - ${app.applicantName} (${app.applicationNumber}).`,
      title: 'Assessment Completed.',
      customerName: app.applicantName,
      applicationNumber: app.applicationNumber,
      status: 'UNDER_REVIEW',
      actionTaken: `The credit assessment for ${app.applicantName} is complete with a recommendation of: ${result.recommendation}. Please review the risk profile to authorize the decision.`,
      userId,
    });

    sendSuccess(res, 'Credit assessment completed and saved successfully.', result, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle fetching the active assessment for a loan application.
 * 
 * @param req Request containing applicationId parameter
 * @param res Response returning the Assessment details
 * @param next Express next callback
 */
export async function getAssessmentByApplicationId(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const applicationId = req.params.applicationId as string;
    const result = await assessmentService.getAssessmentByApplicationId(applicationId);
    sendSuccess(res, 'Credit assessment retrieved successfully', result);
  } catch (error) {
    next(error);
  }
}
