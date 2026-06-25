import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

/**
 * Sends a standardized success API response
 */
export function sendSuccess<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Sends a standardized error API response
 */
export function sendError(
  res: Response,
  message: string,
  errors?: any,
  statusCode: number = 500
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
