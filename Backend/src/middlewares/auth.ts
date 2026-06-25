/**
 * @file auth.ts
 * @description Authentication and Role-Based Access Control (RBAC) middleware.
 * 
 * BUSINESS CONTEXT:
 * Role-Based Access Control (RBAC) exists to enforce separation of duties in the lending workflow.
 * An LOS handles critical financial operations where tasks must be partitioned:
 * - LOAN_OFFICER: Can create applications and manage files but cannot evaluate credit risk.
 * - CREDIT_ANALYST: Performs risk assessment but cannot authorize loan payouts.
 * - APPROVER: Holds senior signing authority to authorize disbursements but does not initiate loans.
 * - SUPER_ADMIN: Administers accounts and views logs but has no lending transaction privileges.
 * 
 * Enforcing RBAC prevents internal fraud, reduces default risk, and satisfies financial compliance audits.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../config/db';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication middleware that verifies the incoming Bearer JWT token.
 * Validates user existence and active status in the database, injecting req.user.
 * 
 * @param req Express request object containing the authorization header
 * @param res Express response object
 * @param next Next middleware callback function
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token required');
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET!; // Guaranteed to exist by fail-fast check on server boot

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      throw new UnauthorizedError('Token is invalid or has expired');
    }

    // Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User profile no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User profile is currently inactive');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization middleware factories that checks if the authenticated user has
 * one of the required roles to access a restricted endpoint.
 * 
 * @param allowedRoles Array of Roles permitted to access the resource
 */
export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('User must be authenticated'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Access denied: Insufficient permissions'));
      return;
    }

    next();
  };
}
