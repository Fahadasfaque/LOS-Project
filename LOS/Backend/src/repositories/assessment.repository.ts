/**
 * @file assessment.repository.ts
 * @description Data access layer for Credit Assessments.
 */

import { prisma } from '../config/db';
import { Assessment, Prisma } from '@prisma/client';

export class AssessmentRepository {
  /**
   * Find assessment by loan application ID.
   */
  async findByApplicationId(applicationId: string): Promise<any | null> {
    return prisma.assessment.findUnique({
      where: { applicationId },
      include: {
        assessedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Upsert assessment details for a specific application.
   */
  async upsert(
    applicationId: string,
    data: Prisma.AssessmentUncheckedCreateInput
  ): Promise<Assessment> {
    return prisma.assessment.upsert({
      where: { applicationId },
      update: data,
      create: { ...data, applicationId },
    });
  }

  /**
   * Create a new assessment.
   */
  async create(data: Prisma.AssessmentUncheckedCreateInput): Promise<Assessment> {
    return prisma.assessment.create({
      data,
    });
  }

  /**
   * Update an existing assessment.
   */
  async update(
    applicationId: string,
    data: Prisma.AssessmentUncheckedUpdateInput
  ): Promise<Assessment> {
    return prisma.assessment.update({
      where: { applicationId },
      data,
    });
  }
}
export const assessmentRepository = new AssessmentRepository();
