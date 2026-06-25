/**
 * @file auth.service.ts
 * @description Coordinates user login validation, token issuance, and audit trail records.
 * 
 * BUSINESS CONTEXT:
 * We use JWT (JSON Web Token) for session management:
 * 1. Statelessness: Decouples user sessions from backend state, allowing easy scaling.
 * 2. Role Storage: Encodes the user's role profile (e.g. LOAN_OFFICER) directly in the payload, 
 *    speeding up client-side and server-side RBAC checks.
 * 3. Security: Signed with a secure HS256 secret key from the environment, preventing client-side tampering.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { UnauthorizedError } from '../utils/errors';
import { auditLogService } from './auditLog.service';

export class AuthService {
  private userRepository = new UserRepository();

  /**
   * Performs user authentication.
   * Validates credentials and generates a signed JWT session token.
   * Logs success or failed authentication attempts to the compliance audit log.
   * 
   * @param email Login email address
   * @param passwordPlain Cleartext password input
   * @param ipAddress The IP address of the client terminal
   * @returns JWT token string and sanitized user details
   * @throws UnauthorizedError if invalid credentials or account is suspended
   */
  async login(
    email: string,
    passwordPlain: string,
    ipAddress?: string
  ): Promise<{ token: string; user: any }> {
    const user = await this.userRepository.findByEmail(email);
    
    // Check if user exists. standard response to prevent account enumeration.
    if (!user) {
      // Audit log failed login
      await auditLogService.logAction(
        undefined,
        'USER_LOGIN_FAILED',
        `Failed login attempt for non-existent email: ${email}`,
        ipAddress
      );
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      // Audit log failed login
      await auditLogService.logAction(
        user.id,
        'USER_LOGIN_FAILED',
        `Failed login attempt for inactive account: ${user.email}`,
        ipAddress
      );
      throw new UnauthorizedError('Account is inactive. Please contact administration.');
    }

    // Verify bcrypt hash
    const isPasswordValid = await bcrypt.compare(passwordPlain, user.password);
    if (!isPasswordValid) {
      // Audit log failed login
      await auditLogService.logAction(
        user.id,
        'USER_LOGIN_FAILED',
        `Failed login attempt (incorrect password) for user: ${user.email}`,
        ipAddress
      );
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET!; // Guaranteed to exist by server boot check
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '8h' }
    );

    // Log the successful authentication
    await auditLogService.logAction(
      user.id,
      'USER_LOGIN',
      `User ${user.email} successfully logged in`,
      ipAddress
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}

export const authService = new AuthService();
