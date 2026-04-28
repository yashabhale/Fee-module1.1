import express from 'express';
import * as feePaymentController from '../controllers/feePaymentController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { createFeePaymentSchema, recordPaymentSchema, submitFeePaymentSchema } from '../validators/feePaymentValidator.js';

const router = express.Router();

// Protected routes
router.use(authenticateToken);

/**
 * POST /api/fee-payments
 * Create a new fee payment record
 * Required roles: admin, accountant
 */
router.post('/',
  authorizeRole('admin', 'accountant'),
  validateRequest(createFeePaymentSchema),
  feePaymentController.createFeePayment
);

/**
 * POST /api/fee-payments/submit
 * Submit fee payment from frontend with validation
 * Validates that amountPaid does not exceed totalAmount
 * Returns 201 with created record
 */
router.post('/submit',
  validateRequest(submitFeePaymentSchema),
  feePaymentController.submitFeePayment
);

/**
 * POST /api/fee-payments/:id/record-payment
 * Record a payment against an existing fee payment record
 * Required roles: admin, accountant
 */
router.post('/:id/record-payment',
  authorizeRole('admin', 'accountant'),
  validateRequest(recordPaymentSchema),
  feePaymentController.recordPayment
);

router.get('/pending', feePaymentController.getPendingPayments);

router.get('/overdue', feePaymentController.getOverduePayments);

router.get('/dashboard/stats', 
  authorizeRole('admin', 'accountant'),
  feePaymentController.getDashboardStats
);

router.get('/dashboard/monthly', 
  authorizeRole('admin', 'accountant'),
  feePaymentController.getMonthlyCollectionData
);

export default router;
