import { razorpayInstance } from '../config/razorpay.js';
import FeePayment from '../models/FeePayment.js';
import logger from '../config/logger.js';
import crypto from 'crypto';

/**
 * Payment Service - Handles all payment-related operations
 */
export class PaymentService {
  /**
   * Create a Razorpay order for payment using Razorpay SDK
   * Returns a real Order ID from Razorpay API
   * @param {Object} orderData - { amount (in rupees), studentName, studentId, invoiceId }
   * @returns {Object} - { orderId, amount (in paise), currency, studentName }
   */
  static async createOrder(orderData) {
    try {
      const { amount, studentName, studentId, invoiceId, totalAmount } = orderData;

      // Validate inputs
      if (!amount || !studentName || !studentId) {
        throw new Error('Missing required fields: amount, studentName, studentId');
      }

      // Razorpay requires amount in paise (smallest unit)
      // Convert rupees to paise: ₹5000 = 500000 paise
      const amountInPaise = Math.round(amount * 100);

      logger.info(`Creating Razorpay order: Amount=${amount} Rs = ${amountInPaise} paise`);

      // Create order in Razorpay SDK
      const order = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `invoice_${invoiceId}_${Date.now()}`,
        notes: {
          studentName,
          studentId,
          invoiceId,
          totalAmount,
        },
      });

      logger.info(`✅ Razorpay order created: ID=${order.id}, Amount=${amountInPaise} paise`);

      return {
        orderId: order.id,
        amount: amountInPaise, // Return in paise for frontend
        currency: 'INR',
        studentName,
        studentId,
        invoiceId,
        status: order.status,
        createdAt: new Date(order.created_at * 1000),
      };
    } catch (error) {
      logger.error(`❌ Error creating Razorpay order: ${error.message}`);
      throw new Error(`Failed to create payment order: ${error.message}`);
    }
  }

  /**
   * Verify payment signature from Razorpay
   * Uses HMAC-SHA256 on orderId|paymentId
   * @param {Object} paymentData - { orderId, paymentId, signature }
   * @param {string} webhookSecret - Razorpay webhook secret from environment
   * @returns {boolean} - True if signature is valid
   */
  static verifyPaymentSignature(paymentData, webhookSecret) {
    try {
      const { orderId, paymentId, signature } = paymentData;

      if (!orderId || !paymentId || !signature || !webhookSecret) {
        logger.warn('Missing parameters for signature verification');
        return false;
      }

      // Create the body for signature verification: orderId|paymentId
      const body = `${orderId}|${paymentId}`;

      // Generate HMAC-SHA256
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      // Compare signatures
      const isValid = expectedSignature === signature;
      
      if (isValid) {
        logger.info(`✅ Payment signature verified for payment ${paymentId}`);
      } else {
        logger.warn(`❌ Payment signature INVALID for payment ${paymentId}`);
        logger.warn(`Expected: ${expectedSignature}, Got: ${signature}`);
      }

      return isValid;
    } catch (error) {
      logger.error(`Error verifying payment signature: ${error.message}`);
      return false;
    }
  }

  /**
   * Update fee payment record after successful transaction
   * UPDATE "FeePayment" SET "paymentStatus" = 'paid', "amountPaid" = amount WHERE student = studentId
   * @param {Object} paymentDetails - { invoiceId, paymentId, amount, studentId }
   * @returns {Object} - { success, message, paymentDetails }
   */
  static async updateFeePaymentAfterSuccess(paymentDetails) {
    try {
      const { invoiceId, paymentId, amount, studentId, orderId } = paymentDetails;

      if (!studentId || !paymentId || !amount) {
        throw new Error('Missing required fields: studentId, paymentId, amount');
      }

      logger.info(`Updating FeePayment for studentId=${studentId}, paymentId=${paymentId}, amount=${amount}`);

      // Find and update FeePayment record
      // UPDATE "FeePayment" 
      // SET "paymentStatus" = 'paid', "amountPaid" = amount
      // WHERE student = studentId
      const feePayment = await FeePayment.findOneAndUpdate(
        { student: studentId, paymentStatus: { $ne: 'paid' } }, // Don't update if already paid
        {
          paymentStatus: 'paid',
          amountPaid: amount,
          $push: {
            payments: {
              amount: amount,
              paymentDate: new Date(),
              paymentMethod: 'online',
              transactionId: paymentId,
              notes: `Razorpay Order: ${orderId}`,
            },
          },
        },
        { new: true }
      );

      if (!feePayment) {
        logger.error(`FeePayment not found for studentId: ${studentId}`);
        throw new Error(`Fee payment record not found for student ${studentId}`);
      }

      logger.info(`✅ FeePayment updated: studentId=${studentId}, paymentStatus=paid, amountPaid=${amount}`);

      return {
        success: true,
        message: 'Payment recorded successfully',
        paymentDetails: {
          studentId: feePayment.student,
          paymentStatus: feePayment.paymentStatus,
          amountPaid: feePayment.amountPaid,
          totalAmount: feePayment.totalAmount,
          transactionId: paymentId,
          paymentDate: feePayment.updatedAt,
        },
      };
    } catch (error) {
      logger.error(`❌ Error updating fee payment: ${error.message}`);
      throw new Error(`Failed to update fee payment: ${error.message}`);
    }
  }

  /**
   * Get payment details from Razorpay API
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Object} - Payment details from Razorpay
   */
  static async getPaymentDetails(paymentId) {
    try {
      const payment = await razorpayInstance.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      logger.error(`Error fetching payment details: ${error.message}`);
      throw new Error(`Failed to fetch payment details: ${error.message}`);
    }
  }

  /**
   * Refund a payment
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Amount to refund (optional, full refund if not provided)
   * @returns {Object} - Refund details
   */
  static async refundPayment(paymentId, amount = null) {
    try {
      const refundData = amount ? { amount: Math.round(amount * 100) } : {};
      const refund = await razorpayInstance.payments.refund(paymentId, refundData);

      logger.info(`Refund processed for payment ${paymentId}`);
      return refund;
    } catch (error) {
      logger.error(`Error processing refund: ${error.message}`);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }
}

export default PaymentService;
