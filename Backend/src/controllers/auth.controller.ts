import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';

/**
 * Handles user authentication.
 * Passes credentials to the AuthService to issue a JWT session token.
 * 
 * @param req Express request containing email and password in the request body
 * @param res Express response returning user profile details and JWT token
 * @param next Express next callback for error middleware forwarding
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await authService.login(email, password, ipAddress);
    sendSuccess(res, 'Authentication successful', result);
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves the profile of the currently logged-in user.
 * Reads user identity data injected into the request object by the auth middleware.
 * 
 * @param req Express request object containing authenticated user payload in req.user
 * @param res Express response returning user details
 * @param next Express next callback
 */
export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    sendSuccess(res, 'Current user profile retrieved', { user: req.user });
  } catch (error) {
    next(error);
  }
}
