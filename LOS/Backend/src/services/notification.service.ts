/**
 * @file notification.service.ts
 * @description Manages customer-facing notifications separately from audit logs.
 *
 * BUSINESS CONTEXT:
 * Audit logs are immutable compliance records for regulatory purposes.
 * Customer notifications are UX communication records — they can be read,
 * filtered, and marked. Mixing them would create compliance risk and poor UX.
 *
 * This service is called from: loanApplication.service, offer.service,
 * disbursement.service, and customer.service. It NEVER calls auditLogService.
 */

import { prisma } from '../config/db';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  /**
   * Creates a customer notification record.
   * Called by other services at workflow transition points.
   *
   * @param userId      The CUSTOMER user ID (owner of the notification)
   * @param applicationId The related loan application ID
   * @param type        The notification type enum
   * @param title       Short notification title (displayed in bell / Action Center)
   * @param message     Detailed notification message
   */
  async createCustomerNotification(
    userId: string,
    applicationId: string,
    type: NotificationType,
    title: string,
    message: string
  ): Promise<void> {
    try {
      await prisma.customerNotification.create({
        data: {
          userId,
          applicationId,
          type,
          title,
          message,
          isRead: false,
        },
      });
    } catch (error) {
      // Non-fatal: log warning but do not throw — notifications must never
      // block the primary workflow transaction.
      console.warn(`[NotificationService] Failed to create notification for user ${userId}:`, error);
    }
  }

  /**
   * Retrieves all notifications for a customer user, ordered by most recent first.
   *
   * @param userId The CUSTOMER user ID
   * @returns Array of CustomerNotification records
   */
  async getNotificationsForUser(userId: string) {
    return prisma.customerNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Count unread notifications for a customer user.
   * Used for the bell badge count.
   *
   * @param userId The CUSTOMER user ID
   * @returns Unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.customerNotification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Marks a specific notification as read. Ownership is enforced.
   *
   * @param notificationId The notification ID
   * @param userId The CUSTOMER user ID (ownership check)
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.customerNotification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Marks all notifications as read for a customer user.
   *
   * @param userId The CUSTOMER user ID
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.customerNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const notificationService = new NotificationService();
