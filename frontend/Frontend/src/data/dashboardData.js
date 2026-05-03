import {
  fetchDashboardStats,
  fetchMonthlyCollectionData,
  fetchPaymentMethodData,
  fetchPendingFeesData,
  fetchRecentTransactions
} from '../services/apiService.js';

// ==================== DASHBOARD DATA FROM DATABASE ====================
// All data is now fetched from the database via API calls

/**
 * Fetch dashboard metrics (Total Collected, Pending, Overdue, Refund Requests)
 * Data comes from transactions table in database
 */
export const getDashboardMetrics = async () => {
  try {
    const result = await fetchDashboardStats();
    
    if (result.success && result.data) {
      const stats = result.data;
      
      // Transform database response to dashboard format
      let totalCollected = 0;
      let totalPending = 0;
      let totalOverdue = 0;
      let totalRefund = 0;

      // Get total collected from overallStats
      if (stats.overallStats) {
        totalCollected = stats.overallStats.totalCollected || 0;
      }

      // Process by-status breakdown
      if (stats.byStatus && Array.isArray(stats.byStatus)) {
        stats.byStatus.forEach(stat => {
          if (stat.status === 'PAID') {
            // totalCollected already set from overallStats
          } else if (stat.status === 'PENDING') {
            totalPending += stat.totalAmount || 0;
          } else if (stat.status === 'PARTIAL') {
            totalPending += stat.totalAmount || 0;
          } else if (stat.status === 'OVERDUE') {
            totalOverdue += stat.totalAmount || 0;
          }
        });
      }

      // Currently no refund tracking in fee payments table
      totalRefund = 0;

      return {
        totalCollected,
        totalPending,
        totalOverdue,
        totalRefund,
      };
    }
    
    // Fallback to default values if API fails
    console.warn('Failed to fetch dashboard metrics from database');
    return {
      totalCollected: 0,
      totalPending: 0,
      totalOverdue: 0,
      totalRefund: 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      totalCollected: 0,
      totalPending: 0,
      totalOverdue: 0,
      totalRefund: 0,
    };
  }
};

/**
 * Fetch monthly fee collection data for the current year
 * Data comes from transactions table grouped by month
 */
export const getMonthlyData = async (year = new Date().getFullYear()) => {
  try {
    const result = await fetchMonthlyCollectionData(year);
    
    if (result.success && result.data && Array.isArray(result.data)) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Transform database response to chart format
      const monthlyMap = new Map();
      
      result.data.forEach(item => {
        const month = item._id || item.month;
        monthlyMap.set(month, {
          month: monthNames[month - 1] || monthNames[0],
          collected: item.total || 0,
          pending: item.pending || 0,
        });
      });

      // Ensure all 12 months are present
      const completeData = [];
      for (let i = 1; i <= 12; i++) {
        completeData.push(
          monthlyMap.get(i) || {
            month: monthNames[i - 1],
            collected: 0,
            pending: 0,
          }
        );
      }

      return completeData;
    }

    // Fallback to empty array if API fails
    console.warn('Failed to fetch monthly data from database');
    return [];
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    return [];
  }
};

/**
 * Fetch payment method distribution
 * Data comes from transactions table with payment method breakdown
 */
export const getPaymentMethodData = async () => {
  try {
    const result = await fetchPaymentMethodData();
    
    if (result.success && result.data) {
      const paymentMethods = {};

      // Aggregate by payment method
      if (Array.isArray(result.data)) {
        result.data.forEach(transaction => {
          const method = transaction.paymentMethod || 'Other';
          if (!paymentMethods[method]) {
            paymentMethods[method] = 0;
          }
          paymentMethods[method] += transaction.amount || 0;
        });
      }

      // Convert to chart format
      return Object.entries(paymentMethods).map(([name, value]) => ({
        name,
        value: Math.round(value),
      }));
    }

    // Fallback to empty array if API fails
    console.warn('Failed to fetch payment method data from database');
    return [];
  } catch (error) {
    console.error('Error fetching payment method data:', error);
    return [];
  }
};

/**
 * Fetch pending fees data for the table
 * Data comes from transactions table where status = 'pending'
 */
export const getPendingFeesData = async (limit = 5) => {
  try {
    const result = await fetchPendingFeesData(1, limit);
    
    if (result.success && result.data) {
      if (Array.isArray(result.data)) {
        return result.data.map((fee, index) => ({
          id: fee.id || index + 1,
          studentName: fee.studentName || 'Unknown',
          class: fee.class || 'N/A',
          amount: fee.amount || 0,
          dueDate: fee.dueDate || new Date().toISOString().split('T')[0],
        }));
      }
    }

    // Fallback to empty array if API fails
    console.warn('Failed to fetch pending fees from database');
    return [];
  } catch (error) {
    console.error('Error fetching pending fees:', error);
    return [];
  }
};

/**
 * Fetch recent transactions data
 * Data comes from FeePayment table sorted by updatedAt descending
 */
export const getRecentTransactionsData = async (limit = 5) => {
  try {
    const result = await fetchRecentTransactions(limit);
    
    if (result.success && result.data) {
      if (Array.isArray(result.data)) {
        return result.data.map((transaction) => ({
          id: transaction.id,
          studentId: transaction.studentId,
          studentName: transaction.studentName || 'Unknown',
          totalAmount: transaction.totalAmount || 0,
          amountPaid: transaction.amountPaid || 0,
          amountPending: transaction.amountPending || 0,
          paymentStatus: transaction.paymentStatus || 'PENDING',
          dueDate: transaction.dueDate ? new Date(transaction.dueDate).toISOString().split('T')[0] : 'N/A',
          createdAt: transaction.createdAt ? new Date(transaction.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastPaymentDate: transaction.lastPaymentDate ? new Date(transaction.lastPaymentDate).toISOString().split('T')[0] : null,
          lastPaymentAmount: transaction.lastPaymentAmount || 0,
        }));
      }
    }

    // Fallback to empty array if API fails
    console.warn('Failed to fetch recent transactions from database');
    return [];
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
};
