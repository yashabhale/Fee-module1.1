// ================================================================
// DASHBOARD SERVICE - Analytics & Metrics Queries
// ================================================================
// Implements dashboard analytics using Prisma ORM
// ================================================================

import prisma from '../config/database';
import logger from '../config/logger';

export class DashboardService {
  /**
   * Get all dashboard metrics
   * Returns: Total collected, pending, overdue, refund requests
   */
  static async getDashboardMetrics() {
    try {
      logger.info('📊 Fetching dashboard metrics...');

      const [totalCollected, pendingPayments, overduePayments, refundRequests] = 
        await Promise.all([
          // Total Fees Collected (Last 12 months)
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              createdAt: {
                gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
              }
            }
          }),

          // Pending Payments
          prisma.feePayment.aggregate({
            _sum: { amountPending: true },
            where: {
              paymentStatus: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
              isActive: true
            }
          }),

          // Overdue Payments
          prisma.feePayment.aggregate({
            _sum: { amountPending: true },
            where: {
              paymentStatus: { in: ['OVERDUE', 'PARTIAL'] },
              dueDate: { lt: new Date() },
              amountPending: { gt: 0 },
              isActive: true
            }
          }),

          // Refund Requests
          prisma.refundRequest.aggregate({
            _sum: { amount: true },
            where: {
              status: { in: ['PENDING', 'APPROVED'] }
            }
          })
        ]);

      const metrics = {
        totalFeesCollected: Number(totalCollected._sum.amount) || 0,
        pendingPayments: Number(pendingPayments._sum.amountPending) || 0,
        overduePayments: Number(overduePayments._sum.amountPending) || 0,
        refundRequests: Number(refundRequests._sum.amount) || 0
      };

      logger.info('✅ Dashboard metrics fetched successfully', metrics);
      return metrics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching dashboard metrics: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get monthly collection trend for bar chart
   * Returns: Array of monthly collections with month names
   */
  static async getMonthlyCollectionTrend(year: number = new Date().getFullYear()) {
    try {
      logger.info(`📈 Fetching monthly collection trend for year ${year}...`);

      const payments = await prisma.$queryRaw<Array<any>>`
        SELECT 
          DATE_TRUNC('month', "Payment"."createdAt")::DATE as collection_month,
          TO_CHAR(DATE_TRUNC('month', "Payment"."createdAt"), 'Mon') as month_name,
          EXTRACT(MONTH FROM "Payment"."createdAt")::INT as month_number,
          COALESCE(SUM("Payment"."amount"), 0)::FLOAT as collected_amount,
          COUNT("Payment"."id")::INT as transaction_count
        FROM "Payment"
        WHERE EXTRACT(YEAR FROM "Payment"."createdAt") = ${year}
        GROUP BY DATE_TRUNC('month', "Payment"."createdAt")
        ORDER BY DATE_TRUNC('month', "Payment"."createdAt") ASC
      `;

      logger.info(`✅ Monthly collection trend fetched: ${(payments as any[]).length} months`);
      return payments;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching monthly trend: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get payment method distribution
   * Returns: Array of payment methods with amounts and percentages
   */
  static async getPaymentMethodDistribution() {
    try {
      logger.info('💳 Fetching payment method distribution...');

      const distribution = await prisma.payment.groupBy({
        by: ['paymentMethod'],
        _sum: { amount: true },
        _count: { id: true },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      // Calculate total for percentage
      const total = distribution.reduce((sum: number, item: any) => 
        sum + Number(item._sum.amount || 0), 0);

      const formattedDistribution = distribution.map((item: any) => ({
        paymentMethod: item.paymentMethod,
        totalAmount: Number(item._sum.amount) || 0,
        transactionCount: item._count.id,
        percentage: total > 0 ? ((Number(item._sum.amount || 0) / total * 100).toFixed(2)) : '0'
      }));

      logger.info('✅ Payment method distribution fetched', formattedDistribution);
      return formattedDistribution.sort((a: any, b: any) => b.totalAmount - a.totalAmount);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching payment method distribution: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get recent transactions
   * Returns: Array of last N transactions with student and fee details
   */
  static async getRecentTransactions(limit: number = 10) {
    try {
      logger.info(`📋 Fetching recent ${limit} transactions...`);

      const transactions = await prisma.payment.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          feePayment: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  studentId: true,
                  classId: true
                }
              }
            }
          }
        }
      });

      const formattedTransactions = transactions.map((trans: any) => ({
        studentName: `${trans.feePayment.student.firstName} ${trans.feePayment.student.lastName}`,
        studentId: trans.feePayment.student.studentId,
        invoiceId: trans.feePaymentId,
        className: trans.feePayment.student.classId || 'N/A',
        amount: Number(trans.amount),
        paymentMethod: trans.paymentMethod,
        status: trans.feePayment.paymentStatus,
        transactionDate: trans.createdAt,
        transactionId: trans.id
      }));

      logger.info(`✅ Recent transactions fetched: ${formattedTransactions.length}`);
      return formattedTransactions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching recent transactions: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get payment status distribution
   * Returns: Count and total by payment status
   */
  static async getPaymentStatusDistribution() {
    try {
      logger.info('📊 Fetching payment status distribution...');

      const distribution = await prisma.feePayment.groupBy({
        by: ['paymentStatus'],
        _count: { id: true },
        _sum: { totalAmount: true },
        where: { isActive: true }
      });

      const formattedDistribution = distribution.map((item: any) => ({
        status: item.paymentStatus,
        count: item._count.id,
        totalAmount: Number(item._sum.totalAmount || 0)
      }));

      logger.info('✅ Payment status distribution fetched', formattedDistribution);
      return formattedDistribution;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching payment status distribution: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get collection efficiency by class
   * Returns: Collection metrics grouped by class
   */
  static async getCollectionByClass() {
    try {
      logger.info('🎓 Fetching collection metrics by class...');

      const classeData = await prisma.class.findMany({
        include: {
          students: {
            where: { status: 'ACTIVE' },
            include: {
              feePayments: {
                where: { isActive: true }
              }
            }
          }
        }
      });

      const classMetrics = classeData.map((cls: any) => {
        const totalStudents = cls.students.length;
        const totalFeeDue = cls.students.reduce((sum: number, student: any) => {
          const studentTotal = (student.feePayments || []).reduce(
            (s: number, fee: any) => s + Number(fee.totalAmount),
            0
          );
          return sum + studentTotal;
        }, 0);

        const totalCollected = cls.students.reduce((sum: number, student: any) => {
          const studentTotal = (student.feePayments || []).reduce(
            (s: number, fee: any) => s + Number(fee.amountPaid),
            0
          );
          return sum + studentTotal;
        }, 0);

        const collectionPercentage = totalFeeDue > 0 ? (totalCollected / totalFeeDue * 100) : 0;

        return {
          className: cls.name,
          classCode: cls.code,
          studentCount: totalStudents,
          totalFeesDue: totalFeeDue,
          totalCollected: totalCollected,
          totalPending: totalFeeDue - totalCollected,
          collectionPercentage: collectionPercentage.toFixed(2)
        };
      });

      logger.info(`✅ Collection by class fetched for ${classMetrics.length} classes`);
      return classMetrics.sort((a: any, b: any) => 
        parseFloat(b.collectionPercentage) - parseFloat(a.collectionPercentage));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching collection by class: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get outstanding student balances
   * Returns: Students with pending payments
   */
  static async getOutstandingBalances(limit: number = 20) {
    try {
      logger.info(`📌 Fetching outstanding balances (top ${limit})...`);

      const students = await prisma.student.findMany({
        where: { status: 'ACTIVE' },
        include: {
          feePayments: {
            where: { isActive: true }
          }
        }
      });

      const outstanding = students
        .map((student: any) => {
          const pendingAmount = (student.feePayments || []).reduce((sum: number, fp: any) => {
            if (fp.paymentStatus !== 'PAID') {
              return sum + Number(fp.amountPending);
            }
            return sum;
          }, 0);

          return {
            studentName: `${student.firstName} ${student.lastName}`,
            studentId: student.studentId,
            className: student.classId ? `Class-${student.classId}` : 'N/A',
            pendingAmount: pendingAmount,
            invoiceCount: (student.feePayments || []).length,
            studentEmail: student.email,
            studentPhone: student.phone
          };
        })
        .filter((s: any) => s.pendingAmount > 0)
        .sort((a: any, b: any) => b.pendingAmount - a.pendingAmount)
        .slice(0, limit);

      logger.info(`✅ Outstanding balances fetched: ${outstanding.length} students`);
      return outstanding;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching outstanding balances: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get refund statistics
   * Returns: Refund count and amount by status
   */
  static async getRefundStats() {
    try {
      logger.info('💰 Fetching refund statistics...');

      const stats = await prisma.refundRequest.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true }
      });

      const formattedStats = stats.map((item: any) => ({
        status: item.status,
        count: item._count.id,
        totalAmount: Number(item._sum.amount || 0)
      }));

      logger.info('✅ Refund statistics fetched', formattedStats);
      return formattedStats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching refund statistics: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get daily collection trend
   * Returns: Collection data grouped by date
   */
  static async getDailyCollectionTrend(days: number = 30) {
    try {
      logger.info(`📅 Fetching daily collection trend for last ${days} days...`);

      const dailyData = await prisma.$queryRaw<Array<any>>`
        SELECT 
          DATE("Payment"."createdAt")::DATE as transaction_date,
          COUNT("Payment"."id")::INT as transaction_count,
          COALESCE(SUM("Payment"."amount"), 0)::FLOAT as daily_collection,
          COALESCE(AVG("Payment"."amount"), 0)::FLOAT as avg_transaction_amount
        FROM "Payment"
        WHERE "Payment"."createdAt" >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE("Payment"."createdAt")
        ORDER BY DATE("Payment"."createdAt") DESC
      `;

      logger.info(`✅ Daily collection trend fetched: ${(dailyData as any[]).length} days`);
      return dailyData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching daily collection trend: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get overdue invoices
   * Returns: Invoices that are overdue and not fully paid
   */
  static async getOverdueInvoices() {
    try {
      logger.info('⚠️ Fetching overdue invoices...');

      const overdueInvoices = await prisma.feePayment.findMany({
        where: {
          paymentStatus: { in: ['OVERDUE', 'PARTIAL'] },
          dueDate: { lt: new Date() },
          amountPending: { gt: 0 },
          isActive: true
        },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              studentId: true,
              phone: true,
              email: true
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      });

      const formattedInvoices = overdueInvoices.map((inv: any) => ({
        invoiceId: inv.id,
        studentName: `${inv.student.firstName} ${inv.student.lastName}`,
        studentId: inv.student.studentId,
        studentPhone: inv.student.phone,
        feeType: 'Fee Payment',
        totalAmount: Number(inv.totalAmount),
        amountPaid: Number(inv.amountPaid),
        amountPending: Number(inv.amountPending),
        dueDate: inv.dueDate,
        daysOverdue: Math.floor((Date.now() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      }));

      logger.info(`✅ Overdue invoices fetched: ${formattedInvoices.length}`);
      return formattedInvoices;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching overdue invoices: ${errorMessage}`);
      throw error;
    }
  }
}

export default DashboardService;
