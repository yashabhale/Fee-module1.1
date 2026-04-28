import { PaymentService } from '../services/paymentService.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHelper.js';
import logger from '../config/logger.js';
import crypto from 'crypto';
import FeePayment from '../models/FeePayment.js';

/**
 * Payment Controller - Handles payment-related API requests
 */

/**
 * POST /api/payments/create-order
 * Initialize Razorpay Order with Order ID
 * Body: { amount, studentName, studentId, invoiceId, totalAmount }
 * Returns: orderId, currency (INR), Razorpay API Key, amount
 */
export const createOrder = async (req, res) => {
  try {
    const { amount, studentName, studentId, invoiceId, totalAmount } = req.body;

    // Validate required fields
    if (!amount || !studentName || !studentId || !invoiceId) {
      return sendErrorResponse(
        res,
        'Missing required fields: amount, studentName, studentId, invoiceId',
        400
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return sendErrorResponse(res, 'Amount must be greater than 0', 400);
    }

    // Create order using PaymentService - returns real order ID from Razorpay
    const orderData = await PaymentService.createOrder({
      amount,
      studentName,
      studentId,
      invoiceId,
      totalAmount,
    });

    logger.info(`Order created successfully: ${orderData.orderId}`);

    return sendSuccessResponse(
      res,
      'Order created successfully',
      {
        orderId: orderData.orderId,
        amount: orderData.amount, // Amount in paise
        currency: 'INR', // Always INR for India
        razorpayKey: process.env.RAZORPAY_KEY_ID, // Send API key to frontend
        studentName: orderData.studentName,
        studentId: orderData.studentId,
        invoiceId: orderData.invoiceId,
      },
      201
    );
  } catch (error) {
    logger.error(`Error in createOrder: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/payments/verify
 * Verify payment signature from Razorpay UPI response
 * Checks signature validity, then updates FeePayment table:
 * UPDATE "FeePayment" SET "paymentStatus" = 'paid', "amountPaid" = amount WHERE student = studentId
 * Body: { orderId, paymentId, signature, studentId, amount }
 */
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, studentId, amount } = req.body;

    // Validate required fields
    if (!orderId || !paymentId || !signature || !studentId || !amount) {
      return sendErrorResponse(
        res,
        'Missing required fields: orderId, paymentId, signature, studentId, amount',
        400
      );
    }

    logger.info(`Verifying payment: ${paymentId} for student: ${studentId}`);

    // Verify payment signature using Razorpay webhook secret
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    const isSignatureValid = expectedSignature === signature;

    if (!isSignatureValid) {
      logger.warn(`Invalid signature for payment ${paymentId}`);
      return sendErrorResponse(
        res,
        'Payment signature verification failed. Payment not valid.',
        400
      );
    }

    logger.info(`Signature verified for payment ${paymentId}`);

    // Signature is valid - Update FeePayment table
    // UPDATE "FeePayment" 
    // SET "paymentStatus" = 'paid', "amountPaid" = amount 
    // WHERE student = studentId
    const feePayment = await FeePayment.findOneAndUpdate(
      { student: studentId, paymentStatus: { $ne: 'paid' } }, // Find and update if not already paid
      {
        paymentStatus: 'paid',
        amountPaid: amount,
        $push: {
          payments: {
            amount: amount,
            paymentDate: new Date(),
            paymentMethod: 'online',
            transactionId: paymentId,
            notes: `Razorpay UPI Payment - Order: ${orderId}`,
          },
        },
      },
      { new: true } // Return the updated document
    );

    if (!feePayment) {
      logger.error(`FeePayment record not found for student: ${studentId}`);
      return sendErrorResponse(
        res,
        'Fee payment record not found for this student',
        404
      );
    }

    logger.info(`FeePayment updated successfully for student ${studentId}`);
    logger.info(`Payment Status: ${feePayment.paymentStatus}, Amount Paid: ${feePayment.amountPaid}`);

    return sendSuccessResponse(
      res,
      'Payment verified successfully and fee payment updated',
      {
        success: true,
        paymentStatus: feePayment.paymentStatus,
        amountPaid: feePayment.amountPaid,
        totalAmount: feePayment.totalAmount,
        paymentDate: feePayment.updatedAt,
        transactionId: paymentId,
        message: `Payment of ₹${amount} recorded successfully. Fee status updated to 'paid'.`,
      },
      200
    );
  } catch (error) {
    logger.error(`Error in verifyPayment: ${error.message}`);
    return sendErrorResponse(res, `Payment verification error: ${error.message}`, 500);
  }
};


/**
 * POST /api/payments/webhook
 * Razorpay webhook handler for asynchronous payment updates
 * This endpoint receives notifications from Razorpay when payment status changes
 */
export const handlePaymentWebhook = async (req, res) => {
  try {
    const event = req.body.event;
    const payload = req.body.payload;

    logger.info(`Webhook received: ${event}`);

    // Handle different payment events
    switch (event) {
      case 'payment.authorized':
        // Payment has been authorized
        await handlePaymentAuthorized(payload.payment);
        break;

      case 'payment.failed':
        // Payment has failed
        await handlePaymentFailed(payload.payment);
        break;

      case 'payment.captured':
        // Payment has been captured (successful)
        await handlePaymentCaptured(payload.payment);
        break;

      default:
        logger.info(`Unhandled webhook event: ${event}`);
    }

    // Always return 200 to acknowledge webhook
    return res.status(200).json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    logger.error(`Error processing webhook: ${error.message}`);
    // Still return 200 to avoid Razorpay retrying
    return res.status(200).json({
      success: false,
      message: 'Webhook processed with error',
    });
  }
};

/**
 * Handle payment.authorized webhook event
 */
async function handlePaymentAuthorized(payment) {
  try {
    const { id: paymentId, amount, notes } = payment;
    const { invoiceId, studentId } = notes;

    logger.info(`Payment authorized: ${paymentId} for invoice ${invoiceId}`);

    // Update fee payment record
    await PaymentService.updateFeePaymentAfterSuccess({
      invoiceId,
      paymentId,
      amount,
      studentId,
    });
  } catch (error) {
    logger.error(`Error handling payment.authorized: ${error.message}`);
  }
}

/**
 * Handle payment.captured webhook event
 */
async function handlePaymentCaptured(payment) {
  try {
    const { id: paymentId, amount, notes, status } = payment;
    const { invoiceId, studentId } = notes;

    logger.info(`Payment captured: ${paymentId} for invoice ${invoiceId}`);

    // Update fee payment record
    await PaymentService.updateFeePaymentAfterSuccess({
      invoiceId,
      paymentId,
      amount,
      studentId,
    });
  } catch (error) {
    logger.error(`Error handling payment.captured: ${error.message}`);
  }
}

/**
 * Handle payment.failed webhook event
 */
async function handlePaymentFailed(payment) {
  try {
    const { id: paymentId, notes } = payment;
    const { invoiceId } = notes;

    logger.warn(`Payment failed: ${paymentId} for invoice ${invoiceId}`);
    // You can implement notification logic here
  } catch (error) {
    logger.error(`Error handling payment.failed: ${error.message}`);
  }
}

/**
 * GET /api/payments/status/:paymentId
 * Get payment status from Razorpay
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return sendErrorResponse(res, 'Payment ID is required', 400);
    }

    const paymentDetails = await PaymentService.getPaymentDetails(paymentId);

    return sendSuccessResponse(
      res,
      'Payment details retrieved successfully',
      {
        paymentId: paymentDetails.id,
        status: paymentDetails.status,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        method: paymentDetails.method,
        vpa: paymentDetails.vpa, // UPI ID for UPI payments
        createdAt: new Date(paymentDetails.created_at * 1000),
      }
    );
  } catch (error) {
    logger.error(`Error in getPaymentStatus: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/payments/refund
 * Refund a payment
 * Body: { paymentId, amount (optional) }
 */
export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount } = req.body;

    if (!paymentId) {
      return sendErrorResponse(res, 'Payment ID is required', 400);
    }

    const refundDetails = await PaymentService.refundPayment(paymentId, amount);

    return sendSuccessResponse(
      res,
      'Refund processed successfully',
      {
        refundId: refundDetails.id,
        paymentId,
        amount: refundDetails.amount,
        status: refundDetails.status,
      }
    );
  } catch (error) {
    logger.error(`Error in refundPayment: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

export default {
  createOrder,
  verifyPayment,
  handlePaymentWebhook,
  getPaymentStatus,
  refundPayment,
};
