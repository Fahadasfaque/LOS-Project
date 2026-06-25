/**
 * @file document.service.ts
 * @description Coordinate customer document registrations, verifications, and compliance audits.
 */

import { DocumentRepository } from '../repositories/document.repository';
import { LoanApplicationRepository } from '../repositories/loanApplication.repository';
import { auditLogService } from './auditLog.service';
import { cloudinaryService } from './cloudinary.service';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { Document, DocumentType, DocumentStatus } from '@prisma/client';

export class DocumentService {
  private repository = new DocumentRepository();
  private appRepository = new LoanApplicationRepository();

  /**
   * Registers a customer document metadata record in the database after uploading to Cloudinary.
   */
  async uploadDocument(
    userId: string,
    data: { applicationId: string; documentType: DocumentType; fileBuffer: Buffer; originalFilename: string }
  ): Promise<Document> {
    const app = await this.appRepository.findById(data.applicationId);
    if (!app) {
      throw new NotFoundError('Loan application not found');
    }
    
    // First, upload to Cloudinary
    let uploadResult;
    try {
      uploadResult = await cloudinaryService.uploadDocument(
        data.fileBuffer,
        app.applicationNumber, // use applicationNumber for folder organization
        data.documentType,
        data.originalFilename
      );
    } catch (error: any) {
      throw new BadRequestError(`Cloudinary upload failed: ${error.message}`);
    }

    const doc = await this.repository.create({
      applicationId: data.applicationId,
      documentType: data.documentType,
      originalName: data.originalFilename,
      publicId: uploadResult.public_id,
      secureUrl: uploadResult.secure_url,
      uploadedById: userId,
    });

    // Audit log the document submission
    await auditLogService.logAction(
      userId,
      'DOCUMENT_UPLOADED',
      `Uploaded document reference ${doc.originalName} (${doc.documentType}) for loan application ${app.applicationNumber}`
    );

    return doc;
  }
  
  /**
   * Deletes a document from Cloudinary and the database.
   */
  async deleteDocument(
    userId: string,
    publicId: string
  ): Promise<void> {
    const doc = await this.repository.findByPublicId(publicId);
    if (!doc) {
      throw new NotFoundError('Document record not found');
    }
    
    // Delete from Cloudinary
    await cloudinaryService.deleteDocument(publicId);
    
    // Delete from Database
    await this.repository.deleteByPublicId(publicId);
    
    // Audit log
    await auditLogService.logAction(
      userId,
      'DOCUMENT_DELETED',
      `Deleted document reference ${doc.originalName} (${doc.documentType}) for loan application ID ${doc.applicationId}`
    );
  }

  /**
   * Updates the verification status of a document (PENDING, VERIFIED, REJECTED).
   */
  async updateDocumentStatus(
    userId: string,
    id: string,
    status: DocumentStatus
  ): Promise<Document> {
    const doc = await this.repository.findById(id);
    if (!doc) {
      throw new NotFoundError('Document record not found');
    }

    const updated = await this.repository.updateStatus(id, status);

    // Audit log the status verification change
    await auditLogService.logAction(
      userId,
      'DOCUMENT_VERIFIED',
      `Updated status of document ${updated.originalName} for application ID ${updated.applicationId} to ${status}`
    );

    return updated;
  }
}

export const documentService = new DocumentService();
