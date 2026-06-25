/**
 * @file document.repository.ts
 * @description Data access layer for Document metadata.
 */

import { prisma } from '../config/db';
import { Document, DocumentType, DocumentStatus } from '@prisma/client';

export class DocumentRepository {
  /**
   * Save a new document reference associated with an application.
   */
  async create(data: {
    applicationId: string;
    documentType: DocumentType;
    originalName: string;
    publicId: string;
    secureUrl: string;
    uploadedById: string;
  }): Promise<Document> {
    return prisma.document.create({
      data,
    });
  }

  /**
   * Retrieve a document reference by ID.
   */
  async findById(id: string): Promise<Document | null> {
    return prisma.document.findUnique({
      where: { id },
    });
  }
  
  /**
   * Retrieve a document reference by public ID.
   */
  async findByPublicId(publicId: string): Promise<Document | null> {
    return prisma.document.findFirst({
      where: { publicId },
    });
  }

  /**
   * Updates verification status of a document (PENDING, VERIFIED, REJECTED).
   */
  async updateStatus(id: string, verificationStatus: DocumentStatus): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data: { verificationStatus },
    });
  }
  
  /**
   * Deletes a document reference by its public ID.
   */
  async deleteByPublicId(publicId: string): Promise<void> {
    await prisma.document.deleteMany({
      where: { publicId }
    });
  }
}
