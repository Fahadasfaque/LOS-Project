import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { ForbiddenError } from '../utils/errors';
import { Role } from '@prisma/client';

/**
 * Handles creation of new user profiles.
 * Restricted to SUPER_ADMIN roles. Passes payload to UserService.
 * 
 * @param req Express request containing new user details (email, password, role, names)
 * @param res Express response returning created user profile details (sanitized)
 * @param next Express next callback
 */
export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const adminId = req.user!.id;
    const user = await userService.createUser(adminId, req.body);
    sendSuccess(res, 'User profile created successfully.', user, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves all user profiles.
 * Restricted to SUPER_ADMIN roles.
 * 
 * @param req Express request object
 * @param res Express response returning array of user profiles
 * @param next Express next callback
 */
export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await userService.getAllUsers();
    sendSuccess(res, 'List of users retrieved.', users);
  } catch (error) {
    next(error);
  }
}

/**
 * Fetches the details of a single user profile.
 * Allowed: SUPER_ADMIN, or the User matching the requested ID.
 * 
 * @param req Express request object containing user ID as url parameter
 * @param res Express response returning user details
 * @param next Express next callback
 */
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const requestor = req.user!;

    // Client-level RBAC: Users are only permitted to query their own records, unless they are SUPER_ADMIN
    if (requestor.role !== Role.SUPER_ADMIN && requestor.id !== id) {
      throw new ForbiddenError('Access denied: You cannot view another user\'s profile.');
    }

    const user = await userService.getUserById(id);
    sendSuccess(res, 'User profile details retrieved.', user);
  } catch (error) {
    next(error);
  }
}
/**
 * Updates a user's details.
 * Allowed: SUPER_ADMIN
 */
export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.id;
    const data = req.body;
    const user = await userService.updateUser(adminId, id, data);
    sendSuccess(res, 'User updated successfully.', user);
  } catch (error) {
    next(error);
  }
}

/**
 * Changes a user's role.
 * Allowed: SUPER_ADMIN
 */
export async function changeRole(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.id;
    const { role } = req.body;
    const user = await userService.changeRole(adminId, id, role);
    sendSuccess(res, 'User role updated successfully.', user);
  } catch (error) {
    next(error);
  }
}

/**
 * Updates a user's active status.
 * Allowed: SUPER_ADMIN
 */
export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.id;
    const { isActive, reason } = req.body;
    const user = await userService.updateStatus(adminId, id, isActive, reason);
    sendSuccess(res, `User ${isActive ? 'activated' : 'deactivated'} successfully.`, user);
  } catch (error) {
    next(error);
  }
}

/**
 * Resets a user's password.
 * Allowed: SUPER_ADMIN
 */
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.id;
    const { newPassword } = req.body;
    await userService.resetPassword(adminId, id, newPassword);
    sendSuccess(res, 'User password reset successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes a user.
 * Allowed: SUPER_ADMIN
 */
export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.id;
    await userService.deleteUser(adminId, id);
    sendSuccess(res, 'User deleted successfully.');
  } catch (error) {
    next(error);
  }
}
