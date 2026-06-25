/**
 * @file user.service.ts
 * @description Coordinates user profile creation, password security, role configuration, and audit logging.
 * 
 * BUSINESS CONTEXT:
 * Access control and role profiling are central to any credit operations workspace.
 * In a loan origination framework, every transaction action must trace back to a specific individual
 * whose identity and scope of authority (role profile) are authenticated and authorized.
 */

import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { User, Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { auditLogService } from './auditLog.service';

export class UserService {
  private userRepository = new UserRepository();

  /**
   * Registers a new system user profile, hashes their password, and logs the administrative creation.
   * Only accessible by SUPER_ADMIN.
   * 
   * @param adminId User ID of the administrator provisioning the profile
   * @param data User creation properties including email, password, name, and role
   * @returns User profile details (excluding password hash)
   * @throws BadRequestError if email already exists
   */
  async createUser(
    adminId: string,
    data: Prisma.UserCreateInput
  ): Promise<Omit<User, 'password'>> {
    // Check if email already registered
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new BadRequestError(`Email address '${data.email}' is already registered`);
    }

    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Write audit log
    await auditLogService.logAction(
      adminId,
      'USER_CREATION',
      `Created user account for ${user.email} with role ${user.role}`
    );

    // Exclude password from the returned object
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Retrieves all registered user accounts.
   * Only accessible by SUPER_ADMIN.
   * 
   * @returns Array of user profile details (excluding password hashes)
   */
  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    return this.userRepository.findAll();
  }

  /**
   * Fetches the profile details of a single user by ID.
   * 
   * @param id User ID to fetch
   * @returns User profile details (excluding password hash)
   * @throws NotFoundError if user not found
   */
  async getUserById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const userService = new UserService();
