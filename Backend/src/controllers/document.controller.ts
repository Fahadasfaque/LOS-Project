/**
 * @file document.controller.ts
 * @description Controller mapping routing requests to DocumentService workflows.
 */

import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service';
import { sendSuccess } from '../utils/response';
import { DocumentType } from '@prisma/client';

export async function uploadDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const file = req.file;
    if (!file) {
      throw new Error('File is required');
    }

    const { applicationId, documentType } = req.body;
    
    const result = await documentService.uploadDocument(userId, {
      applicationId,
      documentType: documentType as DocumentType,
      fileBuffer: file.buffer,
      originalFilename: file.originalname,
    });
    
    sendSuccess(res, 'Document uploaded successfully', result, 201);
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const publicId = req.params.publicId as string;
    
    await documentService.deleteDocument(userId, publicId);
    sendSuccess(res, 'Document deleted successfully', null);
  } catch (error) {
    next(error);
  }
}

export async function updateDocumentStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { status } = req.body;
    
    const result = await documentService.updateDocumentStatus(userId, id, status);
    sendSuccess(res, 'Document verification status updated', result);
  } catch (error) {
    next(error);
  }
}
