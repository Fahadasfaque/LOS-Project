/**
 * @file settings.service.ts
 * @description Business logic for user-facing settings: profile, security, notifications, and system config.
 *
 * BUSINESS CONTEXT:
 * Each authenticated user can manage their own profile details and notification preferences.
 * SUPER_ADMIN additionally controls the global email service toggle that governs whether
 * ANY email is dispatched by the LOS application.
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { auditLogService } from './auditLog.service';

export const EMAIL_SERVICE_KEY = 'EMAIL_SERVICE_ENABLED';

export class SettingsService {
  // ─── Profile ────────────────────────────────────────────────────────────────

  /**
   * Returns the public profile fields for the authenticated user.
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundError('User profile not found.');
    return user;
  }

  /**
   * Updates firstName and/or lastName of the authenticated user.
   * Email is intentionally excluded from editable fields.
   */
  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found.');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    await auditLogService.logAction(
      userId,
      'PROFILE_UPDATED',
      `User ${user.email} updated their profile.`
    );

    return updated;
  }

  // ─── Security ───────────────────────────────────────────────────────────────

  /**
   * Verifies the current password then updates to the new password.
   * Throws if current password is incorrect or new passwords do not match.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found.');

    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordValid) {
      throw new BadRequestError('Current password is incorrect.');
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await auditLogService.logAction(
      userId,
      'PASSWORD_CHANGED',
      `User ${user.email} changed their password.`
    );
  }

  // ─── Notification Preferences ───────────────────────────────────────────────

  /**
   * Returns the notification preferences for a user.
   * If no record exists yet, returns the default (email enabled).
   */
  async getNotificationPrefs(userId: string) {
    const prefs = await prisma.userNotificationPrefs.findUnique({
      where: { userId },
    });

    if (!prefs) {
      // Return defaults without persisting — upserted on first PATCH
      return { userId, emailNotifications: true };
    }

    return prefs;
  }

  /**
   * Upserts the notification preferences for a user.
   */
  async updateNotificationPrefs(
    userId: string,
    data: { emailNotifications?: boolean }
  ) {
    const prefs = await prisma.userNotificationPrefs.upsert({
      where: { userId },
      create: {
        userId,
        emailNotifications: data.emailNotifications ?? true,
      },
      update: {
        ...(data.emailNotifications !== undefined && {
          emailNotifications: data.emailNotifications,
        }),
      },
    });

    return prefs;
  }

  // ─── Global Email Service (SUPER_ADMIN) ─────────────────────────────────────

  /**
   * Returns the current state of the global email service toggle.
   * Defaults to enabled (true) if no config record exists.
   */
  async getEmailServiceStatus(): Promise<{ enabled: boolean }> {
    const config = await prisma.systemConfig.findUnique({
      where: { key: EMAIL_SERVICE_KEY },
    });

    return { enabled: config ? config.value === 'true' : true };
  }

  /**
   * Sets the global email service enabled/disabled state.
   * Only callable by SUPER_ADMIN (enforced at controller + route level).
   */
  async setEmailServiceStatus(
    adminId: string,
    enabled: boolean
  ): Promise<{ enabled: boolean }> {
    await prisma.systemConfig.upsert({
      where: { key: EMAIL_SERVICE_KEY },
      create: { key: EMAIL_SERVICE_KEY, value: String(enabled) },
      update: { value: String(enabled) },
    });

    await auditLogService.logAction(
      adminId,
      'EMAIL_SERVICE_TOGGLED',
      `Global email service ${enabled ? 'ENABLED' : 'DISABLED'} by admin.`
    );

    return { enabled };
  }
}

export const settingsService = new SettingsService();
