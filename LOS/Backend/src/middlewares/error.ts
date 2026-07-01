import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

/**
 * Global Express error handling middleware
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check if it is a custom AppError
  if (err instanceof AppError) {
    sendError(res, err.message, err.errors, err.statusCode);
    return;
  }

  // Log unknown exceptions
  console.error('[UNHANDLED EXCEPTION]:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  sendError(res, message, undefined, statusCode);
}
