import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';
import { sendSuccess } from '../utils/response';
import { ForbiddenError } from '../utils/errors';
import { Role } from '@prisma/client';

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const profile = await settingsService.getProfile(userId);
    sendSuccess(res, 'Profile retrieved.', profile);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { firstName, lastName } = req.body;
    const updated = await settingsService.updateProfile(userId, {
      firstName,
      lastName,
    });
    sendSuccess(res, 'Profile updated successfully.', updated);
  } catch (error) {
    next(error);
  }
}

// ─── Security ─────────────────────────────────────────────────────────────────

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    await settingsService.changePassword(userId, currentPassword, newPassword);
    sendSuccess(res, 'Password updated successfully.');
  } catch (error) {
    next(error);
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getNotificationPrefs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const prefs = await settingsService.getNotificationPrefs(userId);
    sendSuccess(res, 'Notification preferences retrieved.', prefs);
  } catch (error) {
    next(error);
  }
}

export async function updateNotificationPrefs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { emailNotifications } = req.body;
    const prefs = await settingsService.updateNotificationPrefs(userId, {
      emailNotifications,
    });
    sendSuccess(res, 'Notification preferences updated.', prefs);
  } catch (error) {
    next(error);
  }
}

// ─── Email Service (SUPER_ADMIN) ──────────────────────────────────────────────

export async function getEmailServiceStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = await settingsService.getEmailServiceStatus();
    sendSuccess(res, 'Email service status retrieved.', status);
  } catch (error) {
    next(error);
  }
}

export async function setEmailServiceStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.user!.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenError('Only administrators can toggle the email service.');
    }
    const { enabled } = req.body;
    const status = await settingsService.setEmailServiceStatus(
      req.user!.id,
      Boolean(enabled)
    );
    sendSuccess(res, `Email service ${status.enabled ? 'enabled' : 'disabled'}.`, status);
  } catch (error) {
    next(error);
  }
}
