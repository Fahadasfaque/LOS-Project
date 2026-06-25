/**
 * @file offer.repository.ts
 * @description Data access layer for Loan Offers.
 */

import { prisma } from '../config/db';
import { Offer, Prisma } from '@prisma/client';

export class OfferRepository {
  /**
   * Find offer by loan application ID.
   */
  async findByApplicationId(applicationId: string): Promise<Offer | null> {
    return prisma.offer.findUnique({
      where: { applicationId },
    });
  }

  /**
   * Upsert offer details.
   */
  async upsert(
    applicationId: string,
    data: Prisma.OfferUncheckedCreateInput
  ): Promise<Offer> {
    return prisma.offer.upsert({
      where: { applicationId },
      update: data,
      create: { ...data, applicationId },
    });
  }

  /**
   * Create new offer.
   */
  async create(data: Prisma.OfferUncheckedCreateInput): Promise<Offer> {
    return prisma.offer.create({
      data,
    });
  }

  /**
   * Update an existing offer status.
   */
  async update(
    applicationId: string,
    data: Prisma.OfferUncheckedUpdateInput
  ): Promise<Offer> {
    return prisma.offer.update({
      where: { applicationId },
      data,
    });
  }
}

export const offerRepository = new OfferRepository();
