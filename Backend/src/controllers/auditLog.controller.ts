import { Request, Response, NextFunction } from 'express';
import { auditLogService } from '../services/auditLog.service';
import { sendSuccess } from '../utils/response';

/**
 * Retrieves all system audit log entries.
 * Restricted to SUPER_ADMIN roles. Used to monitor admin actions and auth trials.
 * 
 * @param req Express request object
 * @param res Express response returning array of compliance audit logs
 * @param next Express next callback
 */
export async function getAllLogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const logs = await auditLogService.getAllLogs();
    sendSuccess(res, 'System audit logs retrieved', logs);
  } catch (error) {
    next(error);
  }
}
