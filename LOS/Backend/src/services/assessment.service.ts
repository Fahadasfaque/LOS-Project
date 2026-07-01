/**
 * @file assessment.service.ts
 * @description Coordinates Credit Underwriting rules and automated assessments.
 */

import { assessmentRepository } from '../repositories/assessment.repository';
import { LoanApplicationRepository } from '../repositories/loanApplication.repository';
import { auditLogService } from './auditLog.service';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { Assessment, RiskLevel, Recommendation, AssessmentStatus } from '@prisma/client';

export class AssessmentService {
  private repository = assessmentRepository;
  private appRepository = new LoanApplicationRepository();

  /**
   * Run automated credit checks and save the assessment.
   * 
   * @param userId The ID of the Credit Analyst
   * @param data Payload containing applicationId and assessmentNotes
   */
  async createAssessment(
    userId: string,
    data: { applicationId: string; assessmentNotes: string }
  ): Promise<Assessment> {
    const app = await this.appRepository.findById(data.applicationId);
    if (!app) {
      throw new NotFoundError('Loan application not found.');
    }

    if (app.status !== 'UNDER_REVIEW') {
      throw new BadRequestError('Assessments can only be run for applications in UNDER_REVIEW status.');
    }

    // Rule-Based Credit Assessment Engine
    let creditScore = 620;
    let riskLevel: RiskLevel = 'HIGH';
    let recommendation: Recommendation = 'REJECT';

    const income = app.monthlyIncome;
    if (income >= 50000) {
      creditScore = 780;
      riskLevel = 'LOW';
      recommendation = 'APPROVE';
    } else if (income >= 30000) {
      creditScore = 700;
      riskLevel = 'MEDIUM';
      recommendation = 'MANUAL_REVIEW';
    } else {
      creditScore = 620;
      riskLevel = 'HIGH';
      recommendation = 'REJECT';
    }

    const assessment = await this.repository.upsert(data.applicationId, {
      applicationId: data.applicationId,
      creditScore,
      riskLevel,
      recommendation,
      assessmentNotes: data.assessmentNotes,
      status: 'COMPLETED',
      assessedById: userId,
    });

    // Create Audit Log
    await auditLogService.logAction(
      userId,
      'ASSESSMENT_COMPLETED',
      `Completed credit assessment for ${app.applicationNumber}: Score ${creditScore}, Risk ${riskLevel}, Recommendation ${recommendation}.`
    );

    return assessment;
  }

  /**
   * Retrieve active assessment for an application.
   */
  async getAssessmentByApplicationId(applicationId: string): Promise<Assessment | null> {
    return this.repository.findByApplicationId(applicationId);
  }

  /**
   * Creates a PENDING assessment reference. Triggers when reviews begin.
   */
  async createPendingAssessment(userId: string, applicationId: string): Promise<Assessment> {
    const app = await this.appRepository.findById(applicationId);
    if (!app) {
      throw new NotFoundError('Loan application not found.');
    }

    const assessment = await this.repository.upsert(applicationId, {
      applicationId,
      creditScore: 0,
      riskLevel: 'HIGH',
      recommendation: 'MANUAL_REVIEW',
      assessmentNotes: '',
      status: 'PENDING',
      assessedById: userId,
    });

    await auditLogService.logAction(
      userId,
      'ASSESSMENT_CREATED',
      `Initialized pending assessment for application ${app.applicationNumber}.`
    );

    return assessment;
  }
}
export const assessmentService = new AssessmentService();
