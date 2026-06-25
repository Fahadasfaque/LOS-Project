/**
 * @file disbursement.repository.ts
 * @description Data access layer for Loan Disbursements.
 */

import { prisma } from '../config/db';
import { Disbursement, Prisma } from '@prisma/client';

export class DisbursementRepository {
  /**
   * Find disbursement by loan application ID.
   */
  async findByApplicationId(applicationId: string): Promise<Disbursement | null> {
    return prisma.disbursement.findUnique({
      where: { applicationId },
    });
  }

  /**
   * Create new disbursement record.
   */
  async create(data: Prisma.DisbursementUncheckedCreateInput): Promise<Disbursement> {
    return prisma.disbursement.create({
      data,
    });
  }
}

export const disbursementRepository = new DisbursementRepository();
