/**
 * @file customer.repository.ts
 * @description Data access layer for customer portal operations.
 *
 * SECURITY: All application queries include customerUserId in the WHERE clause.
 * This is the database-level enforcement of customer data isolation.
 * Even if a bug bypasses the service-layer ownership check, the query will
 * return null for any application the customer does not own.
 */

import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

export class CustomerRepository {
  // ─── Application Queries (Ownership-Safe) ────────────────────────────────

  /**
   * Find all loan applications belonging to a specific customer.
   * Returns only fields safe for customer consumption.
   */
  async findApplicationsByCustomerUserId(customerUserId: string) {
    return prisma.loanApplication.findMany({
      where: { customerUserId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        applicationNumber: true,
        applicantName: true,
        loanType: true,
        loanAmount: true,
        monthlyIncome: true,
        employmentType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        offer: {
          select: {
            id: true,
            loanAmount: true,
            interestRate: true,
            tenureMonths: true,
            emiAmount: true,
            offerStatus: true,
            expiresAt: true,
            acceptedAt: true,
            generatedAt: true,
          },
        },
        disbursement: {
          select: {
            id: true,
            amount: true,
            referenceNumber: true,
            status: true,
            disbursedAt: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find a single loan application owned by a specific customer.
   * Includes documents and status history for the timeline view.
   * EXCLUDES: creditScore, riskLevel, recommendation, assessmentNotes.
   */
  async findApplicationByIdAndCustomerUserId(
    applicationId: string,
    customerUserId: string
  ) {
    return prisma.loanApplication.findFirst({
      where: { id: applicationId, customerUserId },
      select: {
        id: true,
        applicationNumber: true,
        applicantName: true,
        email: true,
        phone: true,
        loanType: true,
        loanAmount: true,
        monthlyIncome: true,
        employmentType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        documents: {
          select: {
            id: true,
            documentType: true,
            originalName: true,
            publicId: true,
            secureUrl: true,
            verificationStatus: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: 'desc' },
        },
        statusHistory: {
          orderBy: { changedAt: 'asc' },
          select: {
            id: true,
            oldStatus: true,
            newStatus: true,
            changedAt: true,
          },
        },
        offer: {
          select: {
            id: true,
            loanAmount: true,
            interestRate: true,
            tenureMonths: true,
            emiAmount: true,
            offerStatus: true,
            expiresAt: true,
            acceptedAt: true,
            generatedAt: true,
          },
        },
        disbursement: {
          select: {
            id: true,
            amount: true,
            referenceNumber: true,
            status: true,
            disbursedAt: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  // ─── Notification Queries ─────────────────────────────────────────────────

  /**
   * Retrieve all notifications for a customer user.
   */
  async findNotificationsByUserId(userId: string) {
    return prisma.customerNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Count unread notifications for badge rendering.
   */
  async countUnreadNotifications(userId: string): Promise<number> {
    return prisma.customerNotification.count({
      where: { userId, isRead: false },
    });
  }

  // ─── Customer Profile Queries ─────────────────────────────────────────────

  /**
   * Find the CustomerProfile record for a customer user.
   */
  async findCustomerProfile(userId: string) {
    return prisma.customerProfile.findUnique({
      where: { userId },
    });
  }

  /**
   * Create or update the CustomerProfile for a customer user.
   */
  async upsertCustomerProfile(
    userId: string,
    data: {
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      nomineeName?: string;
      nomineePhone?: string;
      occupation?: string;
    }
  ) {
    return prisma.customerProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
    });
  }

  // ─── Document Queries ─────────────────────────────────────────────────────

  /**
   * Find a document by ID for an application owned by the customer.
   * Used for ownership-safe replacement and deletion.
   */
  async findDocumentByIdAndCustomerUserId(
    documentId: string,
    customerUserId: string
  ) {
    return prisma.document.findFirst({
      where: {
        id: documentId,
        application: { customerUserId },
      },
    });
  }

  /**
   * Find a loan officer (creator) for a given application.
   * Used to send upload notifications to the assigned officer.
   */
  async findLoanOfficerByApplicationId(applicationId: string) {
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      select: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        applicationNumber: true,
        applicantName: true,
      },
    });
    return app;
  }
}

export const customerRepository = new CustomerRepository();
