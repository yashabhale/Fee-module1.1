export const calculateOverdueFee = (dueDate, gracePeriodDays = 0, penaltyPerDay = 0) => {
  const today = new Date();
  const graceEndDate = new Date(dueDate);
  graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays);

  if (today <= graceEndDate) {
    return {
      isOverdue: false,
      penalty: 0,
      daysOverdue: 0
    };
  }

  const daysOverdue = Math.floor((today - graceEndDate) / (1000 * 60 * 60 * 24));
  const penalty = daysOverdue * penaltyPerDay;

  return {
    isOverdue: true,
    penalty,
    daysOverdue
  };
};

export const calculatePendingAmount = (totalAmount, amountPaid, penalty = 0, discount = 0) => {
  return Math.max(0, totalAmount + penalty - discount - amountPaid);
};

export const getPaymentStatus = (totalAmount, amountPaid, dueDate, gracePeriodDays = 0) => {
  const pending = totalAmount - amountPaid;

  if (pending <= 0) {
    return 'paid';
  }

  if (amountPaid > 0 && pending > 0) {
    return 'partial';
  }

  const graceEndDate = new Date(dueDate);
  graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays);

  if (new Date() > graceEndDate) {
    return 'overdue';
  }

  return 'pending';
};

export const generateReceiptNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REC-${Date.now()}-${random}`;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};
