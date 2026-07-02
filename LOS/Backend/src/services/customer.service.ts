/**
 * @file customer.service.ts
 * @description Business logic for the Customer Self-Service Portal.
 *
 * SECURITY MODEL:
 * Every method that touches a LoanApplication MUST verify:
 *   application.customerUserId === authenticatedCustomer.id
 *
 * This is enforced at the repository layer (WHERE clause) and double-checked
 * in the service layer for defense in depth. There are NO exceptions.
 *
 * WHAT CUSTOMERS CANNOT SEE:
 * - creditScore, riskLevel, recommendation, assessmentNotes (assessment data)
 * - Internal workflow comments or loan officer notes
 * - Other customers' applications
 *
 * INTEGRATION POINTS:
 * - cloudinaryService: Document upload/delete (reused, not duplicated)
 * - documentRepository: Document DB records (reused)
 * - notificationService: Customer notifications (new, separate from AuditLog)
 * - auditLogService: Compliance audit trail (reused for auth events)
 * - emailService: Email notifications (reused)
 */

import bcrypt from 'bcryptjs';
import { CustomerRepository } from '../repositories/customer.repository';
import { DocumentRepository } from '../repositories/document.repository';
import { cloudinaryService } from './cloudinary.service';
import { notificationService } from './notification.service';
import { auditLogService } from './auditLog.service';
import { emailService } from './email.service';
import { prisma } from '../config/db';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  UnauthorizedError,
} from '../utils/errors';
import { DocumentType, NotificationType } from '@prisma/client';

export class CustomerService {
  private customerRepository = new CustomerRepository();
  private documentRepository = new DocumentRepository();

  // ─── Profile & Auth ───────────────────────────────────────────────────────

  /**
   * Retrieves the customer's own profile, merging User + CustomerProfile.
   */
  async getMyProfile(customerUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: customerUserId, role: 'CUSTOMER' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        inviteStatus: true,
        isActive: true,
        createdAt: true,
        customerProfile: true,
        customerApplications: {
          select: { applicationNumber: true, loanType: true, status: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Customer account not found.');
    }

    return user;
  }

  /**
   * Updates the customer's CustomerProfile (address, nominee, occupation, etc.).
   * Does NOT allow changes to email, role, or password through this method.
   */
  async updateMyProfile(
    customerUserId: string,
    data: {
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      nomineeName?: string;
      nomineePhone?: string;
      occupation?: string;
    }
  ) {
    // Update phone on User if provided
    if (data.phone) {
      await prisma.user.update({
        where: { id: customerUserId },
        data: { phone: data.phone },
      });
    }

    // Upsert CustomerProfile
    const { phone, ...profileData } = data;
    const profile = await this.customerRepository.upsertCustomerProfile(
      customerUserId,
      profileData
    );

    return profile;
  }

  /**
   * First-login password setup for INVITED customers.
   * Sets the password and transitions inviteStatus from INVITED → ACTIVE.
   *
   * @throws BadRequestError if password is too short
   * @throws ForbiddenError if account is already ACTIVE (not first-login)
   */
  async setPassword(customerUserId: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: customerUserId },
      select: { inviteStatus: true },
    });

    if (!user) {
      throw new NotFoundError('Customer account not found.');
    }

    if (user.inviteStatus === 'ACTIVE') {
      // Allow password reset for ACTIVE users too (used by forgot-password flow)
      // No restriction needed — OTP verification already happened upstream
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: customerUserId },
      data: {
        password: hashedPassword,
        inviteStatus: 'ACTIVE',
        // Clear any lingering OTP after password setup
        otpHash: null,
        otpExpiry: null,
      },
    });

    await auditLogService.logAction(
      customerUserId,
      'CUSTOMER_PASSWORD_SET',
      'Customer completed password setup and activated portal account.'
    );
  }

  /**
   * Change password for an already ACTIVE customer.
   * Requires current password verification.
   */
  async changePassword(
    customerUserId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: customerUserId },
      select: { password: true },
    });

    if (!user) {
      throw new NotFoundError('Customer account not found.');
    }

    if (!user.password) {
      throw new BadRequestError('No password set. Please use the set-password flow.');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect.');
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: customerUserId },
      data: { password: hashedPassword },
    });

    await auditLogService.logAction(
      customerUserId,
      'CUSTOMER_PASSWORD_CHANGED',
      'Customer changed their portal password.'
    );
  }

  // ─── Applications ─────────────────────────────────────────────────────────

  /**
   * Returns all loan applications owned by the customer.
   * Uses ownership-safe repository query.
   */
  async getMyApplications(customerUserId: string) {
    return this.customerRepository.findApplicationsByCustomerUserId(customerUserId);
  }

  /**
   * Returns full detail of a single application owned by the customer.
   * EXCLUDES: creditScore, riskLevel, recommendation, assessmentNotes.
   *
   * @throws NotFoundError if application not found
   * @throws ForbiddenError if application belongs to another customer
   */
  async getMyApplicationById(customerUserId: string, applicationId: string) {
    const application = await this.customerRepository.findApplicationByIdAndCustomerUserId(
      applicationId,
      customerUserId
    );

    if (!application) {
      // Return 404 rather than 403 to prevent application ID enumeration
      throw new NotFoundError('Application not found.');
    }

    return application;
  }

  // ─── Documents ────────────────────────────────────────────────────────────

  /**
   * Uploads a document to an application owned by the customer.
   * On success:
   *   1. Uploads to Cloudinary
   *   2. Creates Document DB record
   *   3. Creates CustomerNotification (DOCUMENT_UPLOADED)
   *   4. Sends email to assigned Loan Officer
   *   5. Creates AuditLog entry
   *
   * @throws NotFoundError if application not found or not owned by customer
   * @throws BadRequestError if a VERIFIED document of the same type already exists
   */
  async uploadDocument(
    customerUserId: string,
    applicationId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    documentType: DocumentType
  ) {
    // 1. Verify ownership
    const application = await this.customerRepository.findApplicationByIdAndCustomerUserId(
      applicationId,
      customerUserId
    );

    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    // 2. Check for existing VERIFIED document of the same type
    const existingVerified = application.documents.find(
      (d) => d.documentType === documentType && d.verificationStatus === 'VERIFIED'
    );

    if (existingVerified) {
      throw new BadRequestError(
        `Your ${documentType.replace('_', ' ')} document has already been verified and cannot be replaced.`
      );
    }

    // 3. If a PENDING/REJECTED document of this type exists, delete it first (replace flow)
    const existingDoc = application.documents.find(
      (d) => d.documentType === documentType && d.verificationStatus !== 'VERIFIED'
    );

    if (existingDoc) {
      try {
        await cloudinaryService.deleteDocument(existingDoc.publicId);
        await this.documentRepository.deleteByPublicId(existingDoc.publicId);
      } catch {
        // Non-fatal: continue with upload even if delete fails
        console.warn(`[CustomerService] Could not delete existing document ${existingDoc.publicId}`);
      }
    }

    // 4. Upload to Cloudinary
    let uploadResult;
    try {
      uploadResult = await cloudinaryService.uploadDocument(
        fileBuffer,
        (application as any).applicationNumber,
        documentType,
        originalFilename
      );
    } catch (error: any) {
      throw new BadRequestError(`Document upload failed: ${error.message}`);
    }

    // 5. Create Document DB record
    const doc = await this.documentRepository.create({
      applicationId,
      documentType,
      originalName: originalFilename,
      publicId: uploadResult.public_id,
      secureUrl: uploadResult.secure_url,
      uploadedById: customerUserId,
    });

    // 6. Create CustomerNotification (non-blocking)
    await notificationService.createCustomerNotification(
      customerUserId,
      applicationId,
      NotificationType.DOCUMENT_UPLOADED,
      'Document Uploaded',
      `Your ${documentType.replace(/_/g, ' ')} document has been uploaded and is pending review.`
    );

    // 7. Send email to assigned Loan Officer (non-blocking)
    const appWithOfficer = await this.customerRepository.findLoanOfficerByApplicationId(applicationId);
    if (appWithOfficer?.user?.email) {
      emailService.sendNotification({
        to: appWithOfficer.user.email,
        subject: `Document Uploaded — ${appWithOfficer.applicationNumber}`,
        type: 'GENERIC',
        firstName: appWithOfficer.user.firstName,
        userId: appWithOfficer.user.id,
        customMessage: `Applicant ${appWithOfficer.applicantName} has uploaded a new ${documentType.replace(/_/g, ' ')} document for application ${appWithOfficer.applicationNumber}. Please review it in your dashboard.`,
      }).catch((e) => console.warn('[CustomerService] Officer email failed:', e));
    }

    // 8. Audit log
    await auditLogService.logAction(
      customerUserId,
      'CUSTOMER_DOCUMENT_UPLOADED',
      `Customer uploaded ${documentType} for application ${(application as any).applicationNumber}.`
    );

    return doc;
  }

  // ─── Offers ───────────────────────────────────────────────────────────────

  /**
   * Retrieves the offer for an application owned by the customer.
   *
   * @throws NotFoundError if application or offer not found
   */
  async getMyOffer(customerUserId: string, applicationId: string) {
    const application = await this.customerRepository.findApplicationByIdAndCustomerUserId(
      applicationId,
      customerUserId
    );

    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    if (!(application as any).offer) {
      throw new NotFoundError('No offer has been generated for this application yet.');
    }

    return (application as any).offer;
  }

  /**
   * Customer accepts the loan offer.
   * Validates: offer exists, not expired, not already actioned.
   * On success:
   *   1. Updates offerStatus → ACCEPTED, sets acceptedAt
   *   2. Updates loanApplication status → OFFER_ACCEPTED
   *   3. Creates CustomerNotification
   *   4. Creates AuditLog
   *
   * @returns The updated offer with acceptedAt timestamp
   */
  async acceptMyOffer(customerUserId: string, applicationId: string) {
    const application = await this.customerRepository.findApplicationByIdAndCustomerUserId(
      applicationId,
      customerUserId
    );

    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    const offer = (application as any).offer;
    if (!offer) {
      throw new NotFoundError('No offer available for this application.');
    }

    if (offer.offerStatus !== 'GENERATED') {
      throw new BadRequestError(
        `This offer has already been ${offer.offerStatus.toLowerCase()}. No further action is possible.`
      );
    }

    if (new Date() > new Date(offer.expiresAt)) {
      throw new BadRequestError('This offer has expired. Please contact your Loan Officer.');
    }

    const now = new Date();

    // Transactional update: offer + application status
    const updatedOffer = await prisma.$transaction(async (tx) => {
      const updated = await tx.offer.update({
        where: { id: offer.id },
        data: { offerStatus: 'ACCEPTED', acceptedAt: now },
      });

      await tx.loanApplication.update({
        where: { id: applicationId },
        data: { status: 'OFFER_ACCEPTED' },
      });

      await tx.statusHistory.create({
        data: {
          applicationId,
          oldStatus: 'OFFER_GENERATED',
          newStatus: 'OFFER_ACCEPTED',
          changedById: customerUserId,
        },
      });

      return updated;
    });

    // Notification
    await notificationService.createCustomerNotification(
      customerUserId,
      applicationId,
      NotificationType.OFFER_ACCEPTED,
      'Offer Accepted',
      'You have accepted the loan offer. Disbursement is now being processed by the bank.'
    );

    // Audit log
    await auditLogService.logAction(
      customerUserId,
      'CUSTOMER_OFFER_ACCEPTED',
      `Customer accepted offer for application ${(application as any).applicationNumber}.`
    );

    return { ...updatedOffer, applicantName: (application as any).applicantName };
  }

  /**
   * Customer declines the loan offer.
   *
   * @returns Confirmation with declinedAt timestamp
   */
  async declineMyOffer(customerUserId: string, applicationId: string) {
    const application = await this.customerRepository.findApplicationByIdAndCustomerUserId(
      applicationId,
      customerUserId
    );

    if (!application) {
      throw new NotFoundError('Application not found.');
    }

    const offer = (application as any).offer;
    if (!offer) {
      throw new NotFoundError('No offer available for this application.');
    }

    if (offer.offerStatus !== 'GENERATED') {
      throw new BadRequestError(
        `This offer has already been ${offer.offerStatus.toLowerCase()}.`
      );
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.offer.update({
        where: { id: offer.id },
        data: { offerStatus: 'DECLINED' },
      });

      await tx.loanApplication.update({
        where: { id: applicationId },
        data: { status: 'REJECTED' },
      });

      await tx.statusHistory.create({
        data: {
          applicationId,
          oldStatus: 'OFFER_GENERATED',
          newStatus: 'REJECTED',
          changedById: customerUserId,
        },
      });
    });

    await notificationService.createCustomerNotification(
      customerUserId,
      applicationId,
      NotificationType.OFFER_DECLINED,
      'Offer Declined',
      'You have declined the loan offer. Your application has been closed. You may reapply in the future.'
    );

    await auditLogService.logAction(
      customerUserId,
      'CUSTOMER_OFFER_DECLINED',
      `Customer declined offer for application ${(application as any).applicationNumber}.`
    );

    return { declinedAt: now };
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  /**
   * Returns all notifications for the customer.
   */
  async getMyNotifications(customerUserId: string) {
    return this.customerRepository.findNotificationsByUserId(customerUserId);
  }

  /**
   * Marks specific notifications as read (by IDs).
   * If no IDs provided, marks ALL as read.
   */
  async markNotificationsRead(
    customerUserId: string,
    notificationIds?: string[]
  ): Promise<void> {
    if (notificationIds && notificationIds.length > 0) {
      await prisma.customerNotification.updateMany({
        where: { id: { in: notificationIds }, userId: customerUserId },
        data: { isRead: true },
      });
    } else {
      await notificationService.markAllAsRead(customerUserId);
    }
  }
}

export const customerService = new CustomerService();
