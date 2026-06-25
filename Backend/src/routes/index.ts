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
import { authenticate, requireRole } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { validateRequest } from '../middlewares/validation';
import {
  loginSchema,
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
} from '../validators/schemas';

const router = Router();

/**
 * Authentication Endpoints
 */
router.post('/auth/login', validateRequest(loginSchema), authController.login);
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
  requireRole([Role.LOAN_OFFICER, Role.SUPER_ADMIN]),
  validateRequest(acceptOfferSchema),
  offerController.acceptOffer
);

router.post(
  '/offers/decline',
  authenticate,
  requireRole([Role.LOAN_OFFICER, Role.SUPER_ADMIN]),
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

export default router;
