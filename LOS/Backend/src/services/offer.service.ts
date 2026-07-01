/**
 * @file offer.service.ts
 * @description Coordinate credit Offer generation and customer acceptance tracking.
 */

import { offerRepository } from '../repositories/offer.repository';
import { LoanApplicationRepository } from '../repositories/loanApplication.repository';
import { auditLogService } from './auditLog.service';
import { notificationService } from './notification.service';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { Offer, OfferStatus, Role } from '@prisma/client';
import { prisma } from '../config/db';

export class OfferService {
  private repository = offerRepository;
  private appRepository = new LoanApplicationRepository();

  /**
   * Generates a loan offer for an approved application.
   * Restrict to APPROVER or SUPER_ADMIN.
   * 
   * @param userId The ID of the authenticated user
   * @param role The role of the user
   * @param data Payload containing applicationId, interestRate, and tenureMonths
   */
  async generateOffer(
    userId: string,
    role: Role,
    data: { applicationId: string; interestRate: number; tenureMonths: number }
  ): Promise<Offer> {
    // 1. Enforce Role restriction (APPROVER or SUPER_ADMIN only)
    if (role !== Role.SUPER_ADMIN && role !== Role.APPROVER) {
      throw new ForbiddenError('Access denied: Only Approvers or Super Admins can generate offers.');
    }

    // 2. Fetch Application
    const app = await this.appRepository.findById(data.applicationId);
    if (!app) {
      throw new NotFoundError('Loan application not found.');
    }

    // 3. Verify status is APPROVED
    if (app.status !== 'APPROVED') {
      throw new BadRequestError('Offers can only be generated for APPROVED applications.');
    }

    // 4. Calculate Monthly EMI Amount
    const P = app.loanAmount;
    const r = data.interestRate / 12 / 100; // monthly interest rate decimal
    const n = data.tenureMonths;

    let emiAmount = 0;
    if (r === 0) {
      emiAmount = P / n;
    } else {
      const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      emiAmount = Math.round(emi * 100) / 100; // round to 2 decimal places
    }

    // 5. Expiry calculation (default 7 days validity)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 6. Upsert Offer record
    const offer = await this.repository.upsert(data.applicationId, {
      applicationId: data.applicationId,
      loanAmount: P,
      interestRate: data.interestRate,
      tenureMonths: n,
      emiAmount,
      offerStatus: OfferStatus.GENERATED,
      generatedAt: new Date(),
      expiresAt,
    });

    // 7. Transition Application status to OFFER_GENERATED
    await this.appRepository.updateStatusWithHistory(
      data.applicationId,
      app.status,
      'OFFER_GENERATED',
      userId
    );

    // 8. Create Audit Log
    await auditLogService.logAction(
      userId,
      'OFFER_GENERATED',
      `Generated loan offer for application ${app.applicationNumber}: Amount ${P}, Rate ${data.interestRate}%, Tenure ${n} months, EMI ${emiAmount}.`
    );

    // 9. Notify Customer (Phase 6) — non-blocking
    if (app.customerUserId) {
      notificationService.createCustomerNotification(
        app.customerUserId,
        data.applicationId,
        'OFFER_GENERATED',
        'Your Loan Offer is Ready',
        `A loan offer has been generated for your application ${app.applicationNumber}. Please log in to review and accept or decline your offer before it expires.`
      ).catch((e) => console.warn('[OfferService] Customer notification failed:', e));
    }

    return offer;
  }

  /**
   * Record customer acceptance for generated offer.
   */
  async acceptOffer(
    userId: string,
    role: Role,
    data: { applicationId: string }
  ): Promise<Offer> {
    // Enforce Role restriction (LOAN_OFFICER or SUPER_ADMIN only)
    if (role !== Role.SUPER_ADMIN && role !== Role.LOAN_OFFICER) {
      throw new ForbiddenError('Access denied: Only Loan Officers or Super Admins can record customer acceptance.');
    }

    const app = await this.appRepository.findById(data.applicationId);
    if (!app) {
      throw new NotFoundError('Loan application not found.');
    }

    if (app.status !== 'OFFER_GENERATED') {
      throw new BadRequestError('Application does not have a generated offer pending acceptance.');
    }

    const offer = await this.repository.findByApplicationId(data.applicationId);
    if (!offer || offer.offerStatus !== OfferStatus.GENERATED) {
      throw new BadRequestError('Active generated offer not found.');
    }

    // Check expiry
    if (new Date() > new Date(offer.expiresAt)) {
      throw new BadRequestError('The generated loan offer has expired.');
    }

    // Update offer
    const updatedOffer = await this.repository.update(data.applicationId, {
      offerStatus: OfferStatus.ACCEPTED,
      acceptedAt: new Date(),
    });

    // Transition loan status to OFFER_ACCEPTED
    await this.appRepository.updateStatusWithHistory(
      data.applicationId,
      app.status,
      'OFFER_ACCEPTED',
      userId
    );

    // Audit Log: OFFER_ACCEPTED (Record Customer Acceptance)
    await auditLogService.logAction(
      userId,
      'OFFER_ACCEPTED',
      `Recorded customer acceptance of loan offer for application ${app.applicationNumber}.`
    );

    return updatedOffer;
  }

  /**
   * Record customer declining of offer.
   */
  async declineOffer(
    userId: string,
    role: Role,
    data: { applicationId: string }
  ): Promise<Offer> {
    // Enforce Role restriction (LOAN_OFFICER or SUPER_ADMIN only)
    if (role !== Role.SUPER_ADMIN && role !== Role.LOAN_OFFICER) {
      throw new ForbiddenError('Access denied: Only Loan Officers or Super Admins can decline offers.');
    }

    const app = await this.appRepository.findById(data.applicationId);
    if (!app) {
      throw new NotFoundError('Loan application not found.');
    }

    if (app.status !== 'OFFER_GENERATED') {
      throw new BadRequestError('Application does not have a generated offer pending acceptance.');
    }

    const offer = await this.repository.findByApplicationId(data.applicationId);
    if (!offer || offer.offerStatus !== OfferStatus.GENERATED) {
      throw new BadRequestError('Active generated offer not found.');
    }

    const updatedOffer = await this.repository.update(data.applicationId, {
      offerStatus: OfferStatus.DECLINED,
    });

    // Transition loan status to REJECTED
    await this.appRepository.updateStatusWithHistory(
      data.applicationId,
      app.status,
      'REJECTED',
      userId
    );

    await auditLogService.logAction(
      userId,
      'LOAN_APPLICATION_STATUS_CHANGE',
      `Customer declined loan offer for application ${app.applicationNumber}. Transitioned to REJECTED.`
    );

    return updatedOffer;
  }
}

export const offerService = new OfferService();
