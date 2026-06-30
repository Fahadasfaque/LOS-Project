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
import { UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors';
import { auditLogService } from './auditLog.service';
import { emailService } from './email.service';
import { prisma } from '../config/db';

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
        `Failed login attempt for non-existent email: ${email}.`,
        ipAddress
      );
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (!user.isActive) {
      // Audit log failed login
      await auditLogService.logAction(
        user.id,
        'USER_LOGIN_FAILED',
        `Failed login attempt for inactive account: ${user.email}.`,
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
        `Failed login attempt (incorrect password) for user: ${user.email}.`,
        ipAddress
      );
      throw new UnauthorizedError('Invalid email or password.');
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
      `User ${user.email} successfully logged in.`,
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

  async requestOtp(email: string, ipAddress?: string, forceNew = false): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundError('Email not found.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive. Please contact administration.');
    }

    // Enforce 60-second OTP cooldown request rate limiting
    if (user.otpExpiry) {
      const isInvited = user.inviteStatus === 'INVITED';
      const expectedLifetimeMs = isInvited ? 48 * 60 * 60 * 1000 : 10 * 60 * 1000;
      const lastGeneratedAt = new Date(user.otpExpiry.getTime() - expectedLifetimeMs);
      const secondsSinceGeneration = (Date.now() - lastGeneratedAt.getTime()) / 1000;

      if (secondsSinceGeneration > 0 && secondsSinceGeneration < 60) {
        const secondsToWait = Math.ceil(60 - secondsSinceGeneration);
        throw new BadRequestError(`Please wait ${secondsToWait} seconds before requesting a new code.`);
      }
    }

    // Skip sending new OTP if user is INVITED and has a valid, non-expired OTP hash
    if (!forceNew && user.inviteStatus === 'INVITED' && user.otpHash && user.otpExpiry && user.otpExpiry > new Date()) {
      return;
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash, otpExpiry },
    });

    await emailService.sendNotification({
      to: user.email,
      subject: `${otpCode} is your Fortress Banking verification code.`,
      type: 'OTP',
      otpCode,
      firstName: user.firstName,
      userId: user.id,
    });

    await auditLogService.logAction(
      user.id,
      'OTP_REQUESTED',
      `OTP requested for user: ${user.email}.`,
      ipAddress
    );
  }

  /**
   * Verifies an OTP for a user and logs them in.
   */
  async verifyOtp(email: string, code: string, ipAddress?: string): Promise<{ token: string; user: any }> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.otpHash || !user.otpExpiry) {
      throw new UnauthorizedError('Invalid OTP.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive. Please contact administration.');
    }

    if (new Date() > user.otpExpiry) {
      throw new UnauthorizedError('OTP has expired.');
    }

    const isOtpValid = await bcrypt.compare(code, user.otpHash);
    if (!isOtpValid) {
      await auditLogService.logAction(
        user.id,
        'OTP_VERIFICATION_FAILED',
        `Failed OTP verification for user: ${user.email}.`,
        ipAddress
      );
      throw new UnauthorizedError('Invalid OTP.');
    }

    // Clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash: null, otpExpiry: null },
    });

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET!;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '8h' }
    );

    await auditLogService.logAction(
      user.id,
      'USER_LOGIN_OTP',
      `User ${user.email} successfully logged in via OTP.`,
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
