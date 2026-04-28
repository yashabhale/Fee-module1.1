const bcrypt = require('bcryptjs');
import prisma from '../config/database';
import { generateTokenPair } from '../config/jwt';
import { ConflictError, NotFoundError, AuthenticationError } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';

export class AuthService {
  async register(
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    password: string,
    role: UserRole = 'STAFF'
  ) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      throw new ConflictError('Email or phone already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role,
      },
    });

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        departmentName: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateUser(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      departmentName?: string;
      phone?: string;
    }
  ) {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        departmentName: true,
      },
    });

    return user;
  }

  async listUsers(
    page: number = 1,
    limit: number = 10,
    role?: UserRole,
    isActive?: boolean
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async toggleUserStatus(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, isActive: true },
    });
  }
}

export default new AuthService();
