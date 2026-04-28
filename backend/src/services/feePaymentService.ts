import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import {
  calculatePaymentStatus,
  calculateOverduePenalty,
  calculatePendingAmount,
  isOverdue,
  calculateDaysOverdue,
} from '../utils/feeCalculations';

export class FeePaymentService {
  async createFeePayment(data: {
    studentId: string;
    feeStructureId: string;
    totalAmount: number;
    dueDate: Date;
    approvedBy?: string;
    notes?: string;
  }) {
    const { studentId, feeStructureId } = data;

    // Check student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check fee structure exists
    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
    });

    if (!feeStructure) {
      throw new NotFoundError('Fee structure not found');
    }

    const amountPending = data.totalAmount;

    const feePayment = await prisma.feePayment.create({
      data: {
        studentId,
        feeStructureId,
        totalAmount: data.totalAmount,
        amountPaid: 0,
        amountPending,
        dueDate: data.dueDate,
        paymentStatus: 'PENDING',
        approvedBy: data.approvedBy,
        notes: data.notes,
      },
      include: {
        student: { select: { id: true, studentId: true, firstName: true } },
        feeStructure: { select: { id: true, academicYear: true } },
      },
    });

    return feePayment;
  }

  async recordPayment(
    feePaymentId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    transactionId?: string,
    notes?: string
  ) {
    const feePayment = await prisma.feePayment.findUnique({
      where: { id: feePaymentId },
      include: { feeStructure: true },
    });

    if (!feePayment) {
      throw new NotFoundError('Fee payment not found');
    }

    if (feePayment.paymentStatus === 'PAID') {
      throw new ValidationError('This fee is already fully paid');
    }

    if (amount <= 0) {
      throw new ValidationError('Payment amount must be greater than 0');
    }

    // Record payment transaction
    const payment = await prisma.payment.create({
      data: {
        feePaymentId,
        amount,
        paymentMethod,
        transactionId,
        notes,
      },
    });

    // Update fee payment
    const newAmountPaid = Number(feePayment.amountPaid) + amount;
    const newAmountPending = Math.max(
      0,
      Number(feePayment.totalAmount) - newAmountPaid
    );

    const newStatus = calculatePaymentStatus(
      newAmountPaid,
      feePayment.totalAmount,
      feePayment.dueDate
    ) as PaymentStatus;

    const updated = await prisma.feePayment.update({
      where: { id: feePaymentId },
      data: {
        amountPaid: newAmountPaid,
        amountPending: newAmountPending,
        paymentStatus: newStatus,
      },
      include: {
        student: { select: { studentId: true, firstName: true } },
        payments: {
          select: { amount: true, paymentMethod: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return updated;
  }

  async getPendingPayments(
    page: number = 1,
    limit: number = 10,
    courseId?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      paymentStatus: { in: ['PENDING', 'PARTIAL'] },
    };

    if (courseId) {
      where.feeStructure = { courseId };
    }

    const [payments, total] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
              city: true,
            },
          },
          feeStructure: { select: { academicYear: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.feePayment.count({ where }),
    ]);

    return { payments, total, page, limit };
  }

  async getOverduePayments(
    page: number = 1,
    limit: number = 10,
    courseId?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      dueDate: { lt: new Date() },
      paymentStatus: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
    };

    if (courseId) {
      where.feeStructure = { courseId };
    }

    const payments = await prisma.feePayment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            city: true,
          },
        },
        feeStructure: { select: { gracePeriodDays: true, penaltyPerDay: true } },
      },
    });

    // Map with penalty calculations
    const overduePayments = payments.map((p) => ({
      ...p,
      daysOverdue: calculateDaysOverdue(
        p.dueDate,
        p.feeStructure.gracePeriodDays || 0
      ),
      estimatedPenalty: calculateOverduePenalty(
        p.dueDate,
        p.feeStructure.gracePeriodDays || 0,
        p.feeStructure.penaltyPerDay || 0
      ),
    }));

    const total = overduePayments.length;

    return {
      payments: overduePayments.slice(skip, skip + limit),
      total,
      page,
      limit,
    };
  }

  async getDashboardStats(courseId?: string) {
    const where: any = {};
    if (courseId) {
      where.feeStructure = { courseId };
    }

    const dashboard = await prisma.feePayment.groupBy({
      by: ['paymentStatus'],
      _sum: { totalAmount: true, amountPaid: true },
      where,
    });

    const paymentMethods = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      _count: true,
      _sum: { amount: true },
    });

    const totalFees = await prisma.feePayment.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where,
    });

    const collected = await prisma.feePayment.aggregate({
      _sum: { amountPaid: true },
      where,
    });

    return {
      overallStats: {
        totalFees: Number(totalFees._sum.totalAmount || 0),
        totalCollected: Number(collected._sum.amountPaid || 0),
        totalRecords: totalFees._count,
      },
      byStatus: dashboard.map((item) => ({
        status: item.paymentStatus,
        totalAmount: Number(item._sum.totalAmount || 0),
        amountCollected: Number(item._sum.amountPaid || 0),
      })),
      byPaymentMethod: paymentMethods.map((item) => ({
        method: item.paymentMethod,
        count: item._count,
        totalAmount: Number(item._sum.amount || 0),
      })),
    };
  }

  async getMonthlyCollectionData(courseId?: string) {
    const last12Months = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last12Months.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      });
    }

    const collections = await prisma.payment.groupBy({
      by: ['createdAt'],
      _sum: { amount: true },
      _count: true,
      where: courseId
        ? {
            feePayment: {
              feeStructure: { courseId },
            },
          }
        : {},
    });

    // Format data by month
    const monthlyData = last12Months.map((m) => {
      const monthCollections = collections.filter(
        (c) =>
          new Date(c.createdAt).getFullYear() === m.year &&
          new Date(c.createdAt).getMonth() + 1 === m.month
      );

      const totalAmount = monthCollections.reduce(
        (sum, c) => sum + Number(c._sum.amount || 0),
        0
      );

      return {
        month: `${m.year}-${String(m.month).padStart(2, '0')}`,
        totalCollected: totalAmount,
        transactionCount: monthCollections.reduce((sum, c) => sum + c._count, 0),
      };
    });

    return monthlyData;
  }

  async getFeePaymentHistory(studentId: string) {
    const payments = await prisma.feePayment.findMany({
      where: { studentId },
      include: {
        payments: {
          select: {
            amount: true,
            paymentMethod: true,
            transactionId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        feeStructure: { select: { academicYear: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments;
  }

  /**
   * Submit fee payment from frontend
   * Validates that amountPaid does not exceed totalAmount
   * Saves to PostgreSQL database using Prisma
   * @param data - Fee payment data including totalAmount, amountPaid, paymentMethod, etc.
   * @returns Created FeePayment record
   */
  async submitFeePayment(data: {
    totalAmount: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    studentId?: string;
    feeStructureId?: string;
    dueDate?: Date;
    notes?: string;
  }) {
    // Validate that amountPaid does not exceed totalAmount
    if (data.amountPaid > data.totalAmount) {
      throw new ValidationError(
        `Amount paid (₹${data.amountPaid}) cannot exceed total amount (₹${data.totalAmount})`
      );
    }

    // Validate amountPaid is not negative
    if (data.amountPaid < 0) {
      throw new ValidationError('Amount paid cannot be negative');
    }

    // Validate totalAmount is positive
    if (data.totalAmount <= 0) {
      throw new ValidationError('Total amount must be greater than 0');
    }

    // Calculate amountPending
    const amountPending = data.totalAmount - data.amountPaid;

    // Determine payment status based on amounts
    let paymentStatus: PaymentStatus = data.paymentStatus || 'PENDING';
    if (data.amountPaid === data.totalAmount) {
      paymentStatus = 'PAID';
    } else if (data.amountPaid > 0 && data.amountPaid < data.totalAmount) {
      paymentStatus = 'PARTIAL';
    }

    // Create the fee payment record
    const feePayment = await prisma.feePayment.create({
      data: {
        totalAmount: data.totalAmount,
        amountPaid: data.amountPaid,
        amountPending,
        paymentStatus,
        studentId: data.studentId || '',
        feeStructureId: data.feeStructureId || '',
        dueDate: data.dueDate || new Date(),
        notes: data.notes,
      },
      include: {
        student: {
          select: { id: true, studentId: true, firstName: true, lastName: true },
        },
        feeStructure: {
          select: { id: true, academicYear: true, courseId: true },
        },
        payments: {
          select: { amount: true, paymentMethod: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return feePayment;
  }

  /**
   * Get recent fee payment transactions (last 5 records)
   * Used for Dashboard to show recent activity
   * @param courseId - Optional course filter
   * @returns Array of recent FeePayment records with student and payment details
   */
  async getRecentTransactions(courseId?: string, limit: number = 5) {
    const where: any = {};
    if (courseId) {
      where.feeStructure = { courseId };
    }

    const recentTransactions = await prisma.feePayment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
          },
        },
        feeStructure: {
          select: {
            id: true,
            academicYear: true,
            courseId: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            transactionId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    // Transform to match frontend expectations
    return recentTransactions.map((transaction) => ({
      id: transaction.id,
      studentId: transaction.student.studentId,
      studentName: `${transaction.student.firstName} ${transaction.student.lastName}`,
      totalAmount: Number(transaction.totalAmount),
      amountPaid: Number(transaction.amountPaid),
      amountPending: Number(transaction.amountPending),
      paymentStatus: transaction.paymentStatus,
      dueDate: transaction.dueDate,
      createdAt: transaction.createdAt,
      lastPaymentDate: transaction.payments[0]?.createdAt || null,
      lastPaymentAmount: transaction.payments[0]?.amount || 0,
    }));
  }
}

export default new FeePaymentService();
