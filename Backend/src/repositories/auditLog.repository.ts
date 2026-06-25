import { prisma } from '../config/db';
import { AuditLog } from '@prisma/client';

export class AuditLogRepository {
  /**
   * Save a new audit log entry
   */
  async create(data: {
    userId?: string;
    action: string;
    details: string;
    ipAddress?: string;
  }): Promise<AuditLog> {
    return prisma.auditLog.create({
      data,
    });
  }

  /**
   * Fetch all audit logs, including basic user details, sorted by date descending
   */
  async findAll(): Promise<any[]> {
    return prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }
}
