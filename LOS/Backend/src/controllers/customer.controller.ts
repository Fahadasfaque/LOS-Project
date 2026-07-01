/**
 * @file customer.controller.ts
 * @description HTTP request handlers for the Customer Self-Service Portal.
 *
 * Each handler extracts the authenticated customer ID from req.user.id
 * (set by the authenticate middleware) and delegates to customerService.
 *
 * All routes are protected by: authenticate + requireRole([Role.CUSTOMER])
 */

import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service';
import { sendSuccess } from '../utils/response';
import { DocumentType } from '@prisma/client';

export class CustomerController {
  // ─── Profile & Auth ───────────────────────────────────────────────────────

  /**
   * GET /customer/me
   * Returns the authenticated customer's profile.
   */
  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await customerService.getMyProfile(req.user!.id);
      return sendSuccess(res, 'Profile retrieved successfully.', profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /customer/me
   * Updates the customer's CustomerProfile fields.
   */
  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await customerService.updateMyProfile(req.user!.id, req.body);
      return sendSuccess(res, 'Profile updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /customer/set-password
   * Sets or resets the customer's password. Used for:
   *   1. First-login setup (INVITED → ACTIVE)
   *   2. Forgot-password reset (after OTP verification)
   */
  async setPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { newPassword } = req.body;
      await customerService.setPassword(req.user!.id, newPassword);
      return sendSuccess(res, 'Password set successfully. Your account is now active.');
    } catch (error) {
      next(error);
    }
  }

  // ─── Applications ─────────────────────────────────────────────────────────

  /**
   * GET /customer/applications
   * Returns all loan applications belonging to the authenticated customer.
   */
  async getMyApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const applications = await customerService.getMyApplications(req.user!.id);
      return sendSuccess(res, 'Applications retrieved successfully.', applications);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /customer/applications/:id
   * Returns full detail of a single application owned by the customer.
   * Sensitive assessment fields are excluded.
   */
  async getMyApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await customerService.getMyApplicationById(
        req.user!.id,
        String(req.params.id)
      );
      return sendSuccess(res, 'Application retrieved successfully.', application);
    } catch (error) {
      next(error);
    }
  }

  // ─── Documents ────────────────────────────────────────────────────────────

  /**
   * POST /customer/documents
   * Uploads a document to an owned application.
   * Expects: multipart/form-data with 'file', 'applicationId', 'documentType'
   */
  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided.' });
      }

      const { applicationId, documentType } = req.body;

      if (!applicationId || !documentType) {
        return res.status(400).json({
          success: false,
          message: 'applicationId and documentType are required.',
        });
      }

      const validTypes = Object.values(DocumentType);
      if (!validTypes.includes(documentType as DocumentType)) {
        return res.status(400).json({
          success: false,
          message: `documentType must be one of: ${validTypes.join(', ')}.`,
        });
      }

      const doc = await customerService.uploadDocument(
        req.user!.id,
        applicationId,
        req.file.buffer,
        req.file.originalname,
        documentType as DocumentType
      );

      return sendSuccess(res, 'Document uploaded successfully.', doc, 201);
    } catch (error) {
      next(error);
    }
  }

  // ─── Offers ───────────────────────────────────────────────────────────────

  /**
   * GET /customer/applications/:id/offer
   * Returns the offer for an owned application.
   */
  async getMyOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const offer = await customerService.getMyOffer(req.user!.id, String(req.params.id));
      return sendSuccess(res, 'Offer retrieved successfully.', offer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /customer/applications/:id/offer/accept
   * Customer accepts the loan offer.
   */
  async acceptMyOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.acceptMyOffer(req.user!.id, String(req.params.id));
      return sendSuccess(res, 'Offer accepted successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /customer/applications/:id/offer/decline
   * Customer declines the loan offer.
   */
  async declineMyOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.declineMyOffer(req.user!.id, String(req.params.id));
      return sendSuccess(res, 'Offer declined.', result);
    } catch (error) {
      next(error);
    }
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  /**
   * GET /customer/notifications
   * Returns all notifications for the authenticated customer.
   */
  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await customerService.getMyNotifications(req.user!.id);
      return sendSuccess(res, 'Notifications retrieved successfully.', notifications);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /customer/notifications/read
   * Marks notifications as read.
   * Body: { notificationIds?: string[] } — if omitted, marks ALL as read.
   */
  async markNotificationsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { notificationIds } = req.body;
      await customerService.markNotificationsRead(req.user!.id, notificationIds);
      return sendSuccess(res, 'Notifications marked as read.');
    } catch (error) {
      next(error);
    }
  }
}

export const customerController = new CustomerController();
