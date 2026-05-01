// ================================================================
// DASHBOARD CONTROLLER - API Endpoints
// ================================================================
// Implements API endpoints that use the DashboardService
// to power the Fees & Payments Dashboard
// ================================================================

import DashboardService from '../services/dashboardService';
import { sendSuccessResponse, sendErrorResponse } from '../middleware/errorHandler';
import logger from '../config/logger';

/**
 * GET /api/fee-payments/dashboard/stats
 * Returns: Dashboard metric cards (Total Collected, Pending, Overdue, Refunds)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const metrics = await DashboardService.getDashboardMetrics();
    return sendSuccessResponse(res, 'Dashboard metrics retrieved successfully', metrics);
  } catch (error) {
    logger.error(`Dashboard stats error: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/fee-payments/dashboard/monthly
 * Query Params: year (optional, default: current year)
 * Returns: Monthly collection trend data for bar chart
 */
export const getMonthlyTrend = async (req, res) => {
  try {
    const { year } = req.query;
    const yearValue = year ? parseInt(year) : new Date().getFullYear();
    
    const monthlyData = await DashboardService.getMonthlyCollectionTrend(yearValue);
    
    return sendSuccessResponse(
      res,
      `Monthly collection trend for ${yearValue} retrieved successfully`,
      monthlyData
    );
  } catch (error) {
    logger.error(`Monthly trend error: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/fee-payments/dashboard/payment-methods
 * Returns: Payment method distribution for donut/pie chart
 */
export const getPaymentMethodStats = async (req, res) => {
  try {
    const distribution = await DashboardService.getPaymentMethodDistribution();
    
    return sendSuccessResponse(
      res,
      'Payment method distribution retrieved successfully',
      distribution
    );
  } catch (error) {
    logger.error(`Payment method stats error: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/fee-payments/dashboard/recent-transactions
 * Query Params: limit (optional, default: 10)
 * Returns: Recent transaction records for dashboard table
 */
export const getRecentTransactions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitValue = Math.min(parseInt(limit) || 10, 50); // Max 50
    
    const transactions = await DashboardService.getRecentTransactions(limitValue);
    
    return sendSuccessResponse(
      res,
      `Last ${limitValue} transactions retrieved successfully`,
      transactions
    );
  } catch (error) {
    logger.error(`Recent transactions error: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/fee-payments/dashboard/status-distribution
 * Returns: Payment status breakdown (Paid, Pending, Partial, Overdue)
 */
export const getStatusDistribution = async (req, res) => {
  try {
    const distribution = await DashboardService.getPaymentStatusDistribution();
    
    return sendSuccessResponse(
      res,
      'Payment status distribution retrieved successfully',
      distribution
    );
  } catch (error) {
    logger.error(`Status distribution error: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/fee-payments/dashboard/by-class
 * Returns: Collection metrics grouped by class
 */
export const getCollectionByClass = async (req, res) => {
  try {
    const classMetrics = await DashboardService.getCollectionByClass();
    
    return sendSuccessResponse(
      res,
      'Collection by class retrieved successfully',
      classMetrics
    );
  } catch (error) {
    logger.error(`Collection by class error: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/fee-payments/dashboard/outstanding
 * Query Params: limit (optional, default: 20)
 * Returns: Students with outstanding balances
 */
export const getOutstandingBalances = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitValue = Math.min(parseInt(limit) || 20, 100); // Max 100
    
    const outstanding = await DashboardService.getOutstandingBalances(limitValue);
    
    return sendSuccessResponse(
      res,
      `Top ${limitValue} outstanding balances retrieved successfully`,
      outstanding
    );
  } catch (error) {
    logger.error(`Outstanding balances error: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/fee-payments/dashboard/refund-stats
 * Returns: Refund statistics by status
 */
export const getRefundStats = async (req, res) => {
  try {
    const stats = await DashboardService.getRefundStats();
    
    return sendSuccessResponse(
      res,
      'Refund statistics retrieved successfully',
      stats
    );
  } catch (error) {
    logger.error(`Refund stats error: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/fee-payments/dashboard/daily-trend
 * Query Params: days (optional, default: 30)
 * Returns: Daily collection trend
 */
export const getDailyTrend = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysValue = Math.min(parseInt(days) || 30, 365); // Max 1 year
    
    const dailyData = await DashboardService.getDailyCollectionTrend(daysValue);
    
    return sendSuccessResponse(
      res,
      `Daily collection trend for last ${daysValue} days retrieved successfully`,
      dailyData
    );
  } catch (error) {
    logger.error(`Daily trend error: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/fee-payments/dashboard/overdue
 * Returns: List of overdue invoices
 */
export const getOverdueInvoices = async (req, res) => {
  try {
    const overdueInvoices = await DashboardService.getOverdueInvoices();
    
    return sendSuccessResponse(
      res,
      'Overdue invoices retrieved successfully',
      overdueInvoices
    );
  } catch (error) {
    logger.error(`Overdue invoices error: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/fee-payments/dashboard/summary
 * Returns: Complete dashboard data (all metrics + charts + tables)
 * This is an aggregated endpoint for initial page load
 */
export const getDashboardSummary = async (req, res) => {
  try {
    // Fetch all data in parallel
    const [
      metrics,
      monthlyTrend,
      paymentMethods,
      recentTransactions,
      statusDistribution,
      classMetrics,
      overdueCount
    ] = await Promise.all([
      DashboardService.getDashboardMetrics(),
      DashboardService.getMonthlyCollectionTrend(new Date().getFullYear()),
      DashboardService.getPaymentMethodDistribution(),
      DashboardService.getRecentTransactions(10),
      DashboardService.getPaymentStatusDistribution(),
      DashboardService.getCollectionByClass(),
      DashboardService.getOverdueInvoices()
    ]);

    const summary = {
      metrics,
      monthlyTrend,
      paymentMethods,
      recentTransactions,
      statusDistribution,
      classMetrics,
      overdueCount: overdueCount.length,
      timestamp: new Date().toISOString()
    };

    return sendSuccessResponse(
      res,
      'Dashboard summary retrieved successfully',
      summary
    );
  } catch (error) {
    logger.error(`Dashboard summary error: ${error.message}`);
    return sendErrorResponse(res, error.message, 500);
  }
};

export default {
  getDashboardStats,
  getMonthlyTrend,
  getPaymentMethodStats,
  getRecentTransactions,
  getStatusDistribution,
  getCollectionByClass,
  getOutstandingBalances,
  getRefundStats,
  getDailyTrend,
  getOverdueInvoices,
  getDashboardSummary
};
