import RefundRequest from '../models/RefundRequest.js';
import FeePayment from '../models/FeePayment.js';
import logger from '../config/logger.js';

export class RefundService {
  static async createRefundRequest(refundData, studentId) {
    try {
      const feePayment = await FeePayment.findById(refundData.feePayment);

      if (!feePayment) {
        throw new Error('Fee payment not found');
      }

      if (feePayment.student.toString() !== studentId) {
        throw new Error('Unauthorized: Fee payment does not belong to this student');
      }

      if (refundData.amount > feePayment.amountPaid) {
        throw new Error(`Refund amount cannot exceed paid amount (${feePayment.amountPaid})`);
      }

      const refundRequest = new RefundRequest({
        ...refundData,
        student: studentId,
        requestDate: new Date()
      });

      await refundRequest.save();
      await refundRequest.populate('student').populate('feePayment');

      logger.info(`Refund request created: ${refundRequest._id}`);
      return refundRequest;
    } catch (error) {
      logger.error(`Create refund request error: ${error.message}`);
      throw error;
    }
  }

  static async approveRefundRequest(refundId, approvalData) {
    try {
      const refundRequest = await RefundRequest.findById(refundId);

      if (!refundRequest) {
        throw new Error('Refund request not found');
      }

      refundRequest.status = 'approved';
      refundRequest.approvedBy = approvalData.approvedBy;
      refundRequest.approvalDate = new Date();
      refundRequest.notes = approvalData.notes;

      await refundRequest.save();

      logger.info(`Refund request approved: ${refundRequest._id}`);
      return refundRequest;
    } catch (error) {
      logger.error(`Approve refund request error: ${error.message}`);
      throw error;
    }
  }

  static async rejectRefundRequest(refundId, rejectionData) {
    try {
      const refundRequest = await RefundRequest.findById(refundId);

      if (!refundRequest) {
        throw new Error('Refund request not found');
      }

      refundRequest.status = 'rejected';
      refundRequest.rejectionReason = rejectionData.rejectionReason;
      refundRequest.approvedBy = rejectionData.approvedBy;

      await refundRequest.save();

      logger.info(`Refund request rejected: ${refundRequest._id}`);
      return refundRequest;
    } catch (error) {
      logger.error(`Reject refund request error: ${error.message}`);
      throw error;
    }
  }

  static async processRefund(refundId, processData) {
    try {
      const refundRequest = await RefundRequest.findById(refundId);

      if (!refundRequest) {
        throw new Error('Refund request not found');
      }

      if (refundRequest.status !== 'approved') {
        throw new Error('Refund request must be approved before processing');
      }

      refundRequest.status = 'processed';
      refundRequest.processedDate = new Date();
      refundRequest.refundTransactionId = processData.transactionId;

      await refundRequest.save();

      logger.info(`Refund processed: ${refundRequest._id}`);
      return refundRequest;
    } catch (error) {
      logger.error(`Process refund error: ${error.message}`);
      throw error;
    }
  }

  static async getRefundRequests(filters, skip, limit) {
    try {
      const refunds = await RefundRequest.find(filters)
        .populate('student')
        .populate('feePayment')
        .populate('approvedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ requestDate: -1 });

      const total = await RefundRequest.countDocuments(filters);

      return { refunds, total };
    } catch (error) {
      logger.error(`Get refund requests error: ${error.message}`);
      throw error;
    }
  }

  static async getRefundStats() {
    try {
      const stats = await RefundRequest.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      logger.error(`Get refund stats error: ${error.message}`);
      throw error;
    }
  }
}
