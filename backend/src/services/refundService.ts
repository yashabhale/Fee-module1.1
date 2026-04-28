import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { RefundStatus, RefundMethod } from '@prisma/client';

export class RefundService {
  async createRefundRequest(data: {
    studentId: string;
    feePaymentId: string;
    amount: number;
    reason: string;
    description?: string;
  }) {
    const { studentId, feePaymentId, amount } = data;

    // Check student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Check fee payment exists
    const feePayment = await prisma.feePayment.findUnique({
      where: { id: feePaymentId },
    });

    if (!feePayment) {
      throw new NotFoundError('Fee payment not found');
    }

    // Validate refund amount
    if (amount <= 0 || amount > Number(feePayment.amountPaid)) {
      throw new ValidationError(
        `Refund amount must be between 0 and ${feePayment.amountPaid}`
      );
    }

    // Check if refund already exists
    const existing = await prisma.refundRequest.findFirst({
      where: {
        feePaymentId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existing) {
      throw new ValidationError('Refund already requested for this payment');
    }

    const refund = await prisma.refundRequest.create({
      data: {
        studentId,
        feePaymentId,
        amount,
        reason: data.reason,
        description: data.description,
        status: 'PENDING',
      },
      include: {
        student: { select: { studentId: true, firstName: true } },
        feePayment: { select: { totalAmount: true } },
      },
    });

    return refund;
  }

  async approveRefundRequest(
    refundId: string,
    approvedBy: string,
    notes?: string
  ) {
    const refund = await prisma.refundRequest.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundError('Refund request not found');
    }

    if (refund.status !== 'PENDING') {
      throw new ValidationError(
        `Only pending refunds can be approved. Current status: ${refund.status}`
      );
    }

    const updated = await prisma.refundRequest.update({
      where: { id: refundId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvalDate: new Date(),
        notes,
      },
      include: {
        student: { select: { studentId: true, firstName: true } },
        feePayment: { select: { id: true, totalAmount: true } },
      },
    });

    return updated;
  }

  async rejectRefundRequest(
    refundId: string,
    rejectionReason: string,
    approvedBy: string
  ) {
    const refund = await prisma.refundRequest.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundError('Refund request not found');
    }

    if (refund.status !== 'PENDING') {
      throw new ValidationError(
        `Only pending refunds can be rejected. Current status: ${refund.status}`
      );
    }

    const updated = await prisma.refundRequest.update({
      where: { id: refundId },
      data: {
        status: 'REJECTED',
        rejectionReason,
        approvedBy,
        approvalDate: new Date(),
      },
    });

    return updated;
  }

  async processRefund(
    refundId: string,
    refundMethod: RefundMethod,
    bankDetails?: {
      accountHolder: string;
      accountNumber: string;
      ifscCode: string;
    },
    transactionId?: string
  ) {
    const refund = await prisma.refundRequest.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundError('Refund request not found');
    }

    if (refund.status !== 'APPROVED') {
      throw new ValidationError(
        `Only approved refunds can be processed. Current status: ${refund.status}`
      );
    }

    // TODO: Integrate with payment gateway here

    const processed = await prisma.refundRequest.update({
      where: { id: refundId },
      data: {
        status: 'PROCESSED',
        refundMethod,
        bankAccountHolder: bankDetails?.accountHolder,
        bankAccountNumber: bankDetails?.accountNumber,
        ifscCode: bankDetails?.ifscCode,
        refundTransactionId: transactionId,
        processedDate: new Date(),
      },
      include: {
        student: { select: { studentId: true, firstName: true } },
        feePayment: { select: { id: true, totalAmount: true } },
      },
    });

    return processed;
  }

  async getRefundRequests(
    page: number = 1,
    limit: number = 10,
    status?: RefundStatus,
    courseId?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (courseId) {
      where.feePayment = { feeStructure: { courseId } };
    }

    const [refunds, total] = await Promise.all([
      prisma.refundRequest.findMany({
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
          feePayment: {
            select: { totalAmount: true, amountPaid: true },
          },
        },
        orderBy: { requestDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.refundRequest.count({ where }),
    ]);

    return { refunds, total, page, limit };
  }

  async getRefundStats(courseId?: string) {
    const where: any = {};
    if (courseId) {
      where.feePayment = { feeStructure: { courseId } };
    }

    const stats = await prisma.refundRequest.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: true,
      where,
    });

    const methodBreakdown = await prisma.refundRequest.groupBy({
      by: ['refundMethod'],
      _sum: { amount: true },
      _count: true,
      where,
    });

    const totalRequested = await prisma.refundRequest.aggregate({
      _sum: { amount: true },
      _count: true,
      where,
    });

    const processed = stats.find((s) => s.status === 'PROCESSED');

    return {
      totalRequested: Number(totalRequested._sum.amount || 0),
      totalCount: totalRequested._count,
      byStatus: stats.map((s) => ({
        status: s.status,
        count: s._count,
        amount: Number(s._sum.amount || 0),
      })),
      byMethod: methodBreakdown.map((m) => ({
        method: m.refundMethod,
        count: m._count,
        amount: Number(m._sum.amount || 0),
      })),
      processedAmount: Number(processed?._sum.amount || 0),
    };
  }
}

export default new RefundService();
