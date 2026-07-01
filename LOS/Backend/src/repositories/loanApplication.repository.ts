/**
 * @file loanApplication.repository.ts
 * @description Data access layer for Loan Applications, status transitions, and histories.
 */

import { prisma } from '../config/db';
import { LoanApplication, LoanStatus, LoanType, Prisma } from '@prisma/client';

export interface ApplicationQueryParams {
  role: string;
  userId: string;
  search?: string;
  status?: LoanStatus;
  loanType?: LoanType;
  skip: number;
  take: number;
}

export class LoanApplicationRepository {
  /**
   * Save a new loan application in the database.
   */
  async create(data: Prisma.LoanApplicationCreateInput): Promise<LoanApplication> {
    return prisma.loanApplication.create({
      data,
    });
  }

  /**
   * Retrieve an application by ID including its documents, user relationship,
   * and ordered status history logs.
   */
  async findById(id: string): Promise<any | null> {
    return prisma.loanApplication.findUnique({
      where: { id },
      include: {
        documents: true,
        offer: true,
        disbursement: {
          include: {
            disbursedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        assessment: {
          include: {
            assessedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          include: {
            changedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Update application details (only permitted in DRAFT state).
   */
  async update(id: string, data: Prisma.LoanApplicationUpdateInput): Promise<LoanApplication> {
    return prisma.loanApplication.update({
      where: { id },
      data,
    });
  }

  /**
   * Updates the application status and inserts an immutable transition log in a single transaction block.
   */
  async updateStatusWithHistory(
    id: string,
    oldStatus: LoanStatus,
    newStatus: LoanStatus,
    changedById: string
  ): Promise<LoanApplication> {
    return prisma.$transaction(async (tx) => {
      // 1. Update application status
      const app = await tx.loanApplication.update({
        where: { id },
        data: { status: newStatus },
      });

      // 2. Add history record
      await tx.statusHistory.create({
        data: {
          applicationId: id,
          oldStatus,
          newStatus,
          changedById,
        },
      });

      return app;
    });
  }

  /**
   * Write initial DRAFT history record.
   */
  async createInitialHistory(id: string, changedById: string): Promise<void> {
    await prisma.statusHistory.create({
      data: {
        applicationId: id,
        oldStatus: null,
        newStatus: 'DRAFT',
        changedById,
      },
    });
  }

  /**
   * Retrieve list and total count matching pagination, search text, and filters.
   */
  async findAndCountAll(params: ApplicationQueryParams): Promise<{ count: number; items: any[] }> {
    const where: Prisma.LoanApplicationWhereInput = {};

    // Enforce role visibility limits: Loan Officers only view their own creations
    if (params.role === 'LOAN_OFFICER') {
      where.userId = params.userId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.loanType) {
      where.loanType = params.loanType;
    }

    if (params.search) {
      const cleanSearch = params.search.trim();
      where.OR = [
        { applicationNumber: { contains: cleanSearch, mode: 'insensitive' } },
        { applicantName: { contains: containsIgnoreCase(cleanSearch), mode: 'insensitive' } },
        { email: { contains: cleanSearch, mode: 'insensitive' } },
      ];
    }

    const [count, items] = await Promise.all([
      prisma.loanApplication.count({ where }),
      prisma.loanApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        include: {
          documents: true,
          assessment: true,
          offer: true,
          disbursement: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return { count, items };
  }
}

// Simple search utility
function containsIgnoreCase(str: string) {
  return str;
}
