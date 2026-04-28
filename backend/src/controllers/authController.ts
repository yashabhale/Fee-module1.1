import { Request, Response } from 'express';
import authService from '../services/authService';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';
import logger from '../config/logger';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, phone, password, role } = req.body;

  const result = await authService.register(
    firstName,
    lastName,
    email,
    phone,
    password,
    role || UserRole.STAFF
  );

  logger.info('User registered', { email, userId: result.user.id });

  sendSuccess(res, 'User registered successfully', result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  logger.info('User logged in', { email, userId: result.user.id });

  sendSuccess(res, 'Login successful', result, 200);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendError(res, 'User not authenticated', [], 401);
  }

  const user = await authService.getUserById(userId);

  sendSuccess(res, 'Profile retrieved successfully', user, 200);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendError(res, 'User not authenticated', [], 401);
  }

  const { firstName, lastName, phone, departmentName } = req.body;

  const user = await authService.updateUser(userId, {
    firstName,
    lastName,
    phone,
    departmentName,
  });

  logger.info('User profile updated', { userId });

  sendSuccess(res, 'Profile updated successfully', user, 200);
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, role, isActive } = req.query;

  const result = await authService.listUsers(
    parseInt(page as string),
    parseInt(limit as string),
    role as UserRole | undefined,
    isActive === 'true'
  );

  sendSuccess(res, 'Users retrieved successfully', result.users, 200, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
});

export const toggleUserStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await authService.toggleUserStatus(id);

    logger.info('User status toggled', { userId: id, isActive: user.isActive });

    sendSuccess(res, 'User status updated successfully', user, 200);
  }
);
