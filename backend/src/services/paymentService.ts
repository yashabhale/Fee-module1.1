import prisma from '../config/database';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import logger from '../config/logger';

let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance() {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new ValidationError('Razorpay credentials not configured');
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
}

export class PaymentService {
  async createRazorpayOrder(amount: number, currency: string = 'INR', receipt?: string) {
    try {
      const razorpay = getRazorpayInstance();

      const options = {
        amount: Math.round(amount * 100),
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
        payment_capture: 1,
      };

      const order = await razorpay.orders.create(options);

      logger.info('Razorpay order created', {
        orderId: order.id,
        amount: options.amount,
        currency,
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
      };
    } catch (error: any) {
      logger.error('Error creating Razorpay order', { error: error.message });
      throw new ValidationError(`Failed to create payment order: ${error.message}`);
    }
  }

  async verifyRazorpayPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      throw new ValidationError('Razorpay credentials not configured');
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      logger.warn('Razorpay payment signature verification failed', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      throw new ValidationError('Invalid payment signature');
    }

    logger.info('Razorpay payment verified', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    return {
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    };
  }

  async recordPayment(feePaymentId: string, data: {
    amount: number;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    notes?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  }) {
    const feePayment = await prisma.feePayment.findUnique({
      where: { id: feePaymentId },
    });

    if (!feePayment) {
      throw new NotFoundError('Fee payment not found');
    }

    if (feePayment.paymentStatus === 'PAID') {
      throw new ValidationError('This fee is already fully paid');
    }

    if (data.amount <= 0) {
      throw new ValidationError('Payment amount must be greater than 0');
    }

    const newAmountPaid = Number(feePayment.amountPaid) + data.amount;
    const newAmountPending = Math.max(0, Number(feePayment.totalAmount) - newAmountPaid);

    let newStatus: PaymentStatus = 'PENDING';
    if (newAmountPaid >= Number(feePayment.totalAmount)) {
      newStatus = 'PAID';
    } else if (newAmountPaid > 0) {
      newStatus = 'PARTIAL';
    }

    const payment = await prisma.payment.create({
      data: {
        feePaymentId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        notes: data.notes,
      },
      include: {
        feePayment: {
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const updated = await prisma.feePayment.update({
      where: { id: feePaymentId },
      data: {
        amountPaid: newAmountPaid,
        amountPending: newAmountPending,
        paymentStatus: newStatus,
      },
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
        },
      },
    });

    logger.info('Payment recorded', {
      feePaymentId,
      amount: data.amount,
      newStatus,
    });

    return {
      payment,
      updatedFeePayment: updated,
    };
  }

  async getPaymentHistory(feePaymentId: string) {
    const feePayment = await prisma.feePayment.findUnique({
      where: { id: feePaymentId },
      include: {
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            transactionId: true,
            createdAt: true,
            notes: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        student: {
          select: {
            studentId: true,
            firstName: true,
            lastName: true,
          },
        },
        feeStructure: {
          select: {
            academicYear: true,
          },
        },
      },
    });

    if (!feePayment) {
      throw new NotFoundError('Fee payment not found');
    }

    return {
      feePaymentId,
      studentName: `${feePayment.student.firstName} ${feePayment.student.lastName}`,
      totalAmount: Number(feePayment.totalAmount),
      amountPaid: Number(feePayment.amountPaid),
      amountPending: Number(feePayment.amountPending),
      paymentStatus: feePayment.paymentStatus,
      payments: feePayment.payments,
    };
  }
}

export default new PaymentService();
