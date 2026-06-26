/**
 * @file loanApplication.service.ts
 * @description Coordinate Loan Application creation, update, transitions, search, and visibility rules.
 * 
 * BUSINESS CONTEXT:
 * Governs the lending origination rules:
 * 1. Sequential Application numbering formats: LOS-YYYY-000001
 * 2. Mandatory PAN protection at rest (AES) and role-based masking on view.
 * 3. Enforces valid workflow transitions between statuses.
 */

import { LoanApplicationRepository } from '../repositories/loanApplication.repository';
import { encrypt, decrypt } from '../utils/encryption';
import { maskPan } from '../utils/masking';
import { isValidTransition } from '../utils/workflow';
import { auditLogService } from './auditLog.service';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { LoanApplication, LoanStatus, LoanType, EmploymentType, Role } from '@prisma/client';
import { prisma } from '../config/db';
import { assessmentService } from './assessment.service';

export interface CreateAppInput {
  applicantName: string;
  email: string;
  phone: string;
  pan: string;
  loanType: LoanType;
  loanAmount: number;
  monthlyIncome: number;
  employmentType: EmploymentType;
}

export class LoanApplicationService {
  private repository = new LoanApplicationRepository();

  /**
   * Initializes a new LoanApplication, generates its serial number, encrypts PAN,
   * sets status to DRAFT, and creates initial status histories.
   * 
   * @param userId Loan officer user ID creating the application
   * @param data Application form fields
   * @returns Created LoanApplication database object
   */
  async createApplication(userId: string, data: CreateAppInput): Promise<any> {
    const currentYear = new Date().getFullYear();
    const prefix = `LOS-${currentYear}-`;

    // Retrieve the highest serial sequence number for the current year
    const latest = await prisma.loanApplication.findFirst({
      where: {
        applicationNumber: { startsWith: prefix },
      },
      orderBy: { applicationNumber: 'desc' },
    });

    let sequence = 1;
    if (latest) {
      const parts = latest.applicationNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
    const applicationNumber = `${prefix}${String(sequence).padStart(6, '0')}`;

    // Encrypt sensitive PAN Card Number using AES-256-GCM
    const panEncrypted = encrypt(data.pan.toUpperCase());

    const app = await this.repository.create({
      applicationNumber,
      applicantName: data.applicantName,
      email: data.email,
      phone: data.phone,
      panEncrypted,
      loanType: data.loanType,
      loanAmount: data.loanAmount,
      monthlyIncome: data.monthlyIncome,
      employmentType: data.employmentType,
      status: 'DRAFT',
      user: { connect: { id: userId } },
    });

    // Create initial DRAFT status history
    await this.repository.createInitialHistory(app.id, userId);

    // Audit log origination
    await auditLogService.logAction(
      userId,
      'LOAN_APPLICATION_CREATE',
      `Created loan application ${app.applicationNumber} in DRAFT status for ${app.applicantName}.`
    );

    return app;
  }

  /**
   * Updates application details. Permitted only if current status is DRAFT.
   */
  async updateApplication(userId: string, id: string, data: Partial<CreateAppInput>): Promise<any> {
    const app = await this.repository.findById(id);
    if (!app) {
      throw new NotFoundError('Loan application not found.');
    }

    if (app.status !== 'DRAFT') {
      throw new BadRequestError('Only applications in DRAFT status can be modified.');
    }

    const updateData: any = {};
    if (data.applicantName) updateData.applicantName = data.applicantName;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.loanType) updateData.loanType = data.loanType;
    if (data.loanAmount) updateData.loanAmount = data.loanAmount;
    if (data.monthlyIncome) updateData.monthlyIncome = data.monthlyIncome;
    if (data.employmentType) updateData.employmentType = data.employmentType;

    if (data.pan) {
      updateData.panEncrypted = encrypt(data.pan.toUpperCase());
    }

    const updated = await this.repository.update(id, updateData);

    await auditLogService.logAction(
      userId,
      'LOAN_APPLICATION_UPDATE',
      `Updated loan application details for ${updated.applicationNumber}.`
    );

    return updated;
  }

  /**
   * Fetches full details of a single loan application. Decrypts and masks PAN PII dynamically
   * based on the viewer's security role.
   * 
   * @param id Application ID to fetch
   * @param userId Requestor's user ID
   * @param role Requestor's security role
   */
  async getApplicationById(id: string, userId: string, role: Role): Promise<any> {
    const app = await this.repository.findById(id);
    if (!app) {
      throw new NotFoundError('Loan application not found.');
    }

    // Role access limits: Loan Officers cannot view details of loans created by others
    if (role === 'LOAN_OFFICER' && app.userId !== userId) {
      throw new ForbiddenError('Access denied: You can only view applications you created.');
    }

    // Decrypt database record and apply masking rule
    try {
      const decryptedPan = decrypt(app.panEncrypted);
      app.pan = maskPan(decryptedPan, role);
    } catch (err) {
      app.pan = 'DECRYPT_ERROR';
    }

    delete app.panEncrypted; // Erase raw ciphertext from payload

    // Audit log the view access (compliance)
    await auditLogService.logAction(
      userId,
      'LOAN_APPLICATION_VIEW',
      `Viewed details of application ${app.applicationNumber} (PAN masked for role: ${role}).`
    );

    return app;
  }

  /**
   * Shifts status from DRAFT to SUBMITTED.
   */
  async submitApplication(userId: string, id: string): Promise<any> {
    const app = await this.repository.findById(id);
    if (!app) {
      throw new NotFoundError('Loan application not found.');
    }

    if (!isValidTransition(app.status, 'SUBMITTED')) {
      throw new BadRequestError(`Cannot transition application status from ${app.status} to SUBMITTED.`);
    }

    const updated = await this.repository.updateStatusWithHistory(
      id,
      app.status,
      'SUBMITTED',
      userId
    );

    await auditLogService.logAction(
      userId,
      'LOAN_APPLICATION_SUBMIT',
      `Submitted application ${updated.applicationNumber} (Transitioned DRAFT -> SUBMITTED).`
    );

    return updated;
  }

  async updateStatus(userId: string, role: Role, id: string, newStatus: LoanStatus): Promise<any> {
    const app = await this.repository.findById(id);
    if (!app) {
      throw new NotFoundError('Loan application not found.');
    }

    if (!isValidTransition(app.status, newStatus)) {
      throw new BadRequestError(`Cannot transition application status from ${app.status} to ${newStatus}.`);
    }

    // Role-based transition restrictions
    if (newStatus === 'DISBURSED' && role !== Role.SUPER_ADMIN && role !== Role.APPROVER) {
      throw new ForbiddenError('Access denied: Only Approvers or Super Admins can disburse funds.');
    }
    if (newStatus === 'UNDER_REVIEW' && role !== Role.SUPER_ADMIN && role !== Role.CREDIT_ANALYST) {
      throw new ForbiddenError('Access denied: Only Credit Analysts or Super Admins can transition applications to UNDER_REVIEW.');
    }

    // Approval Guard: Applications cannot be APPROVED unless a completed assessment exists
    if (newStatus === 'APPROVED') {
      const assessment = await prisma.assessment.findUnique({
        where: { applicationId: id },
      });
      if (!assessment || assessment.status !== 'COMPLETED') {
        throw new BadRequestError('Applications cannot be APPROVED unless a completed assessment exists.');
      }
    }

    const updated = await this.repository.updateStatusWithHistory(
      id,
      app.status,
      newStatus,
      userId
    );

    // Initialize PENDING assessment on UNDER_REVIEW transition
    if (newStatus === 'UNDER_REVIEW') {
      await assessmentService.createPendingAssessment(userId, id);
    }

    await auditLogService.logAction(
      userId,
      'LOAN_APPLICATION_STATUS_CHANGE',
      `Transitioned application ${updated.applicationNumber} from ${app.status} to ${newStatus}.`
    );

    return updated;
  }

  /**
   * Fetches paginated list of applications matching search queries and filters.
   */
  async listApplications(
    role: Role,
    userId: string,
    query: { search?: string; status?: LoanStatus; loanType?: LoanType; page?: string; limit?: string }
  ): Promise<any> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const result = await this.repository.findAndCountAll({
      role,
      userId,
      search: query.search,
      status: query.status,
      loanType: query.loanType,
      skip,
      take: limit,
    });

    const sanitizedItems = result.items.map((item) => {
      const copy = { ...item };
      try {
        const decryptedPan = decrypt(copy.panEncrypted);
        copy.pan = maskPan(decryptedPan, role);
      } catch (err) {
        copy.pan = '***';
      }
      delete copy.panEncrypted;
      return copy;
    });

    return {
      total: result.count,
      page,
      limit,
      items: sanitizedItems,
    };
  }
}

export const loanApplicationService = new LoanApplicationService();
