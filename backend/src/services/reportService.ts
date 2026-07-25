import prisma from '../config/database';
import logger from '../config/logger';

/**
 * Report Service
 * Handles fetching and preparing data for various reports
 */

export const getDashboardStats = async () => {
  try {
    // Total fees collected from all payments in the last year
    const totalFeesCollected = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        },
      },
    });

    // Pending payments
    const pendingPayments = await prisma.feePayment.aggregate({
      _sum: {
        amountPending: true,
      },
      where: {
        paymentStatus: {
          in: ['PENDING', 'PARTIAL', 'OVERDUE'],
        },
        isActive: true,
      },
    });

    // Overdue payments
    const overduePayments = await prisma.feePayment.aggregate({
      _sum: {
        amountPending: true,
      },
      where: {
        paymentStatus: {
          in: ['OVERDUE', 'PARTIAL'],
        },
        dueDate: {
          lt: new Date(),
        },
        amountPending: {
          gt: 0,
        },
        isActive: true,
      },
    });

    // Refund requests
    const refundRequests = await prisma.refundRequest.aggregate({
      _sum: {
        amount: true,
      },
      _count: true,
      where: {
        status: {
          in: ['PENDING', 'APPROVED'],
        },
      },
    });

    return {
      totalFeesCollected: Number(totalFeesCollected._sum.amount || 0),
      pendingPayments: Number(pendingPayments._sum.amountPending || 0),
      overduePayments: Number(overduePayments._sum.amountPending || 0),
      refundRequests: Number(refundRequests._sum.amount || 0),
      refundCount: refundRequests._count,
    };
  } catch (error: any) {
    logger.error(`Get dashboard stats error: ${error.message}`);
    throw error;
  }
};

export const getMonthlyCollectionTrends = async () => {
  try {
    const payments = await prisma.payment.groupBy({
      by: ['createdAt'],
      _sum: {
        amount: true,
      },
      _count: true,
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Aggregate by month
    const monthlyData = new Map();
    payments.forEach((payment: any) => {
      const month = new Date(payment.createdAt).getMonth();
      const monthName = new Date(payment.createdAt).toLocaleString('default', {
        month: 'long',
      });
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { month: monthName, amount: 0, count: 0 });
      }
      const data = monthlyData.get(month);
      data.amount += parseFloat(payment._sum.amount || 0);
      data.count += payment._count;
    });

    return Array.from(monthlyData.values());
  } catch (error: any) {
    logger.error(`Get monthly trends error: ${error.message}`);
    throw error;
  }
};

export const getPaymentMethodDistribution = async () => {
  try {
    const methods = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      _sum: {
        amount: true,
      },
      _count: true,
    });

    return methods.map((method: any) => ({
      method: method.paymentMethod || 'Unknown',
      amount: parseFloat(method._sum.amount || 0),
      count: method._count,
    }));
  } catch (error: any) {
    logger.error(`Get payment method distribution error: ${error.message}`);
    throw error;
  }
};

export const getRecentTransactions = async (limit: number = 15) => {
  try {
    const transactions = await prisma.payment.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        feePayment: {
          include: {
            student: true
          }
        }
      },
    });

    return transactions.map((t: any) => ({
      id: t.id,
      studentId: t.feePayment?.student?.studentId,
      studentName: t.feePayment?.student?.firstName ? 
        `${t.feePayment.student.firstName} ${t.feePayment.student.lastName}` : 'Unknown',
      amount: Number(t.amount),
      paymentMethod: t.paymentMethod,
      transactionId: t.transactionId,
      totalAmount: t.amount,
      amountPaid: t.amount,
      paymentStatus: 'PAID',
      date: t.createdAt,
    }));
  } catch (error: any) {
    logger.error(`Get recent transactions error: ${error.message}`);
    throw error;
  }
};

export const getPendingPaymentsReport = async (limit: number = 20) => {
  try {
    const pending = await prisma.feePayment.findMany({
      where: {
        amountPending: {
          gt: 0,
        },
        isActive: true,
      },
      take: limit,
      orderBy: {
        dueDate: 'asc',
      },
      include: {
        student: true,
      },
    });

    return pending.map((p: any) => ({
      studentId: p.studentId,
      studentName: p.student?.name || 'Unknown',
      email: p.student?.email || '',
      totalAmount: p.totalAmount,
      amountPaid: p.amountPaid,
      amountPending: p.amountPending,
      dueDate: p.dueDate,
      status: p.paymentStatus,
      daysOverdue: Math.floor(
        (Date.now() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
  } catch (error: any) {
    logger.error(`Get pending payments error: ${error.message}`);
    throw error;
  }
};

export const getRefundRequestsReport = async (limit: number = 10) => {
  try {
    const refunds = await prisma.refundRequest.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        student: true,
      },
    });

    return refunds.map((r: any) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.student?.name || 'Unknown',
      amount: r.amount,
      reason: r.reason,
      status: r.status,
      requestDate: r.createdAt,
      processedDate: r.updatedAt,
    }));
  } catch (error: any) {
    logger.error(`Get refund requests error: ${error.message}`);
    throw error;
  }
};

export const getComprehensiveReportData = async () => {
  try {
    const [
      dashboardStats,
      monthlyTrends,
      paymentMethods,
      recentTransactions,
      pendingPayments,
      refundRequests,
    ] = await Promise.all([
      getDashboardStats(),
      getMonthlyCollectionTrends(),
      getPaymentMethodDistribution(),
      getRecentTransactions(15),
      getPendingPaymentsReport(20),
      getRefundRequestsReport(10),
    ]);

    return {
      dashboardStats,
      monthlyTrends,
      paymentMethods,
      recentTransactions,
      pendingPayments,
      refundRequests,
    };
  } catch (error: any) {
    logger.error(`Get comprehensive report data error: ${error.message}`);
    throw error;
  }
};

export default {
  getDashboardStats,
  getMonthlyCollectionTrends,
  getPaymentMethodDistribution,
  getRecentTransactions,
  getPendingPaymentsReport,
  getRefundRequestsReport,
  getComprehensiveReportData,
};
