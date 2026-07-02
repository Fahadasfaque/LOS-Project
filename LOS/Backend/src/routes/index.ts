import { Router } from 'express';
import { Role } from '@prisma/client';
import * as authController from '../controllers/auth.controller';
import * as userController from '../controllers/user.controller';
import * as auditLogController from '../controllers/auditLog.controller';
import * as loanApplicationController from '../controllers/loanApplication.controller';
import * as documentController from '../controllers/document.controller';
import * as assessmentController from '../controllers/assessment.controller';
import * as offerController from '../controllers/offer.controller';
import * as disbursementController from '../controllers/disbursement.controller';
import { customerController } from '../controllers/customer.controller';
import * as settingsController from '../controllers/settings.controller';
import { authenticate, requireRole } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { validateRequest } from '../middlewares/validation';
import {
  loginSchema,
  requestOtpSchema,
  verifyOtpSchema,
  createUserSchema,
  createApplicationSchema,
  updateApplicationSchema,
  updateStatusSchema,
  uploadDocumentSchema,
  updateDocumentStatusSchema,
  createAssessmentSchema,
  generateOfferSchema,
  acceptOfferSchema,
  disburseLoanSchema,
  bulkCreateUserSchema,
  bulkCreateApplicationSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateNotificationPrefsSchema,
  setEmailServiceStatusSchema,
} from '../validators/schemas';

const router = Router();

/**
 * Authentication Endpoints
 */
router.post('/auth/login', validateRequest(loginSchema), authController.login);
router.post('/auth/otp/request', validateRequest(requestOtpSchema), authController.requestOtp);
router.post('/auth/otp/verify', validateRequest(verifyOtpSchema), authController.verifyOtp);
router.get('/auth/me', authenticate, authController.me);

/**
 * User Management Endpoints (Strictly RBAC protected)
 */
router.post(
  '/users',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  validateRequest(createUserSchema),
  userController.createUser
);
router.post(
  '/users/bulk',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  validateRequest(bulkCreateUserSchema),
  userController.bulkCreateUsers
);
router.get(
  '/users',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  userController.getAllUsers
);
router.get(
  '/users/:id',
  authenticate,
  userController.getUserById
);
router.put(
  '/users/:id',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  userController.updateUser
);
router.patch(
  '/users/:id/role',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  userController.changeRole
);
router.patch(
  '/users/:id/status',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  userController.updateStatus
);
router.patch(
  '/users/:id/reset-password',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  userController.resetPassword
);
router.delete(
  '/users/:id',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  userController.deleteUser
);

/**
 * Audit Compliance Endpoints
 */
router.get(
  '/audit-logs',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  auditLogController.getAllLogs
);

/**
 * Loan Application Lifecycle Endpoints
 */
router.post(
  '/applications',
  authenticate,
  requireRole([Role.LOAN_OFFICER, Role.SUPER_ADMIN]),
  validateRequest(createApplicationSchema),
  loanApplicationController.createApplication
);
router.post(
  '/applications/bulk',
  authenticate,
  requireRole([Role.LOAN_OFFICER, Role.SUPER_ADMIN]),
  validateRequest(bulkCreateApplicationSchema),
  loanApplicationController.bulkCreateApplications
);

router.get(
  '/applications',
  authenticate,
  loanApplicationController.listApplications
);

router.get(
  '/applications/:id',
  authenticate,
  loanApplicationController.getApplicationById
);

router.put(
  '/applications/:id',
  authenticate,
  requireRole([Role.LOAN_OFFICER, Role.SUPER_ADMIN]),
  validateRequest(updateApplicationSchema),
  loanApplicationController.updateApplication
);

router.post(
  '/applications/:id/submit',
  authenticate,
  requireRole([Role.LOAN_OFFICER, Role.SUPER_ADMIN]),
  loanApplicationController.submitApplication
);

router.put(
  '/applications/:id/status',
  authenticate,
  requireRole([Role.CREDIT_ANALYST, Role.APPROVER, Role.SUPER_ADMIN]),
  validateRequest(updateStatusSchema),
  loanApplicationController.updateStatus
);

/**
 * Document Origination Endpoints
 */
router.post(
  '/documents',
  authenticate,
  requireRole([Role.LOAN_OFFICER, Role.SUPER_ADMIN]),
  upload.single('file'),
  documentController.uploadDocument
);

router.delete(
  '/documents/:publicId',
  authenticate,
  requireRole([Role.LOAN_OFFICER, Role.SUPER_ADMIN]),
  documentController.deleteDocument
);

router.put(
  '/documents/:id/status',
  authenticate,
  requireRole([Role.CREDIT_ANALYST, Role.SUPER_ADMIN]),
  validateRequest(updateDocumentStatusSchema),
  documentController.updateDocumentStatus
);

/**
 * Credit Assessment Endpoints
 */
router.post(
  '/assessments',
  authenticate,
  requireRole([Role.CREDIT_ANALYST, Role.SUPER_ADMIN]),
  validateRequest(createAssessmentSchema),
  assessmentController.createAssessment
);

router.get(
  '/assessments/:applicationId',
  authenticate,
  requireRole([Role.CREDIT_ANALYST, Role.APPROVER, Role.SUPER_ADMIN]),
  assessmentController.getAssessmentByApplicationId
);

/**
 * Offer Endpoints
 */
router.post(
  '/offers/generate',
  authenticate,
  requireRole([Role.APPROVER, Role.SUPER_ADMIN]),
  validateRequest(generateOfferSchema),
  offerController.generateOffer
);

router.post(
  '/offers/accept',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),  // Customers use /customer/applications/:id/offer/accept
  validateRequest(acceptOfferSchema),
  offerController.acceptOffer
);

router.post(
  '/offers/decline',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),  // Customers use /customer/applications/:id/offer/decline
  validateRequest(acceptOfferSchema),
  offerController.declineOffer
);

/**
 * Disbursement Endpoints
 */
router.post(
  '/disbursements',
  authenticate,
  requireRole([Role.APPROVER, Role.SUPER_ADMIN]),
  validateRequest(disburseLoanSchema),
  disbursementController.disburseLoan
);
/**
 * Customer Self-Service Portal Endpoints
 * RBAC: Role.CUSTOMER only (completely isolated from employee routes)
 */

// ─── Auth & Profile ────────────────────────────────────────────────────────
router.get(
  '/customer/me',
  authenticate,
  requireRole([Role.CUSTOMER]),
  customerController.getMyProfile.bind(customerController)
);

router.patch(
  '/customer/me',
  authenticate,
  requireRole([Role.CUSTOMER]),
  customerController.updateMyProfile.bind(customerController)
);

router.post(
  '/customer/set-password',
  authenticate,
  requireRole([Role.CUSTOMER]),
  customerController.setPassword.bind(customerController)
);

router.post(
  '/customer/change-password',
  authenticate,
  requireRole([Role.CUSTOMER]),
  customerController.changePassword.bind(customerController)
);

// ─── Applications ──────────────────────────────────────────────────────────
router.get(
  '/customer/applications',
  authenticate,
  requireRole([Role.CUSTOMER]),
  customerController.getMyApplications.bind(customerController)
);

router.get(
  '/customer/applications/:id',
  authenticate,
  requireRole([Role.CUSTOMER]),
  customerController.getMyApplicationById.bind(customerController)
);

// ─── Offers ─────────────────────────────────────────────────────────────────
router.get(
  '/customer/applications/:id/offer',
  authenticate,
  requireRole([Role.CUSTOMER]),
  customerController.getMyOffer.bind(customerController)
);

router.post(
  '/customer/applications/:id/offer/accept',
  authenticate,
  requireRole([Role.CUSTOMER]),
  customerController.acceptMyOffer.bind(customerController)
);

router.post(
  '/customer/applications/:id/offer/decline',
  authenticate,
  requireRole([Role.CUSTOMER]),
  customerController.declineMyOffer.bind(customerController)
);

// Sanction Letter download (PDF)
router.get(
  '/customer/applications/:id/sanction-letter',
  authenticate,
  requireRole([Role.CUSTOMER]),
  customerController.downloadSanctionLetter.bind(customerController)
);

// ─── Documents ──────────────────────────────────────────────────────────────
router.post(
  '/customer/documents',
  authenticate,
  requireRole([Role.CUSTOMER]),
  upload.single('file'),
  customerController.uploadDocument.bind(customerController)
);

// ─── Notifications ──────────────────────────────────────────────────────────
router.get(
  '/customer/notifications',
  authenticate,
  requireRole([Role.CUSTOMER]),
  customerController.getMyNotifications.bind(customerController)
);

router.patch(
  '/customer/notifications/read',
  authenticate,
  requireRole([Role.CUSTOMER]),
  customerController.markNotificationsRead.bind(customerController)
);

/**
 * Settings Endpoints (self-service for any authenticated user)
 */
router.get('/settings/profile', authenticate, settingsController.getProfile);
router.patch('/settings/profile', authenticate, validateRequest(updateProfileSchema), settingsController.updateProfile);
router.patch('/settings/security', authenticate, validateRequest(changePasswordSchema), settingsController.changePassword);
router.get('/settings/notifications', authenticate, settingsController.getNotificationPrefs);
router.patch('/settings/notifications', authenticate, validateRequest(updateNotificationPrefsSchema), settingsController.updateNotificationPrefs);
router.get(
  '/settings/email-service',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  settingsController.getEmailServiceStatus
);
router.patch(
  '/settings/email-service',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  validateRequest(setEmailServiceStatusSchema),
  settingsController.setEmailServiceStatus
);

export default router;
