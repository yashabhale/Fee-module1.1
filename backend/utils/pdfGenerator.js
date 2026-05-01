import PDFDocument from 'pdfkit';
import logger from '../config/logger.js';

/**
 * PDF Generator Utility
 * Creates professional PDF reports with pdfkit
 */
export class PDFGenerator {
  /**
   * Generate professional PDF report
   * @param {Object} reportData - Data to include in the report
   * @returns {Buffer} PDF buffer
   */
  static generateReport(reportData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: 'A4',
        });

        let buffers = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', (err) => {
          reject(err);
        });

        // Generate report content
        this.addHeader(doc);
        this.addDashboardStats(doc, reportData.dashboardStats);
        doc.addPage();
        this.addMonthlyTrends(doc, reportData.monthlyTrends);
        doc.addPage();
        this.addPaymentMethodDistribution(doc, reportData.paymentMethods);
        this.addRecentTransactions(doc, reportData.recentTransactions);
        doc.addPage();
        this.addPendingPayments(doc, reportData.pendingPayments);
        doc.addPage();
        this.addRefundRequests(doc, reportData.refundRequests);
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        logger.error(`PDF generation error: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Add header to PDF
   */
  static addHeader(doc) {
    // Title
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('Fees & Payments Dashboard Report', {
        align: 'center',
      });

    // Subtitle
    doc
      .fontSize(12)
      .font('Helvetica')
      .text('Fee Collection Summary & Analysis', {
        align: 'center',
      });

    // Generated date
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Report Generated: ${new Date().toLocaleString()}`, {
        align: 'center',
      });

    doc.moveTo(40, doc.y + 10).lineTo(555, doc.y + 10).stroke('#CCCCCC');
    doc.moveDown(1);
  }

  /**
   * Add dashboard statistics section
   */
  static addDashboardStats(doc, stats) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Key Metrics');

    doc.moveDown(0.5);

    const statBoxWidth = 120;
    const statBoxHeight = 70;
    const startX = 50;
    const startY = doc.y;

    // Box 1: Total Fees Collected
    this.drawStatBox(
      doc,
      startX,
      startY,
      statBoxWidth,
      statBoxHeight,
      'Total Fees Collected',
      `₹${stats.totalFeesCollected.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      '#2E7D32'
    );

    // Box 2: Pending Payments
    this.drawStatBox(
      doc,
      startX + statBoxWidth + 20,
      startY,
      statBoxWidth,
      statBoxHeight,
      'Pending Payments',
      `₹${stats.pendingPayments.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      '#F57C00'
    );

    // Box 3: Overdue Payments
    this.drawStatBox(
      doc,
      startX + (statBoxWidth + 20) * 2,
      startY,
      statBoxWidth,
      statBoxHeight,
      'Overdue Payments',
      `₹${stats.overduePayments.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      '#D32F2F'
    );

    // Box 4: Refund Requests
    this.drawStatBox(
      doc,
      startX + (statBoxWidth + 20) * 3,
      startY,
      statBoxWidth,
      statBoxHeight,
      'Refund Requests',
      `₹${stats.refundRequests.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      '#1976D2'
    );

    doc.moveDown(6);
  }

  /**
   * Draw a statistics box
   */
  static drawStatBox(doc, x, y, width, height, label, value, color) {
    // Background
    doc.fillColor(color).opacity(0.1).rect(x, y, width, height).fill();

    // Border
    doc.strokeColor(color).lineWidth(2).rect(x, y, width, height).stroke();

    // Label
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text(label, x + 8, y + 8, {
        width: width - 16,
      });

    // Value
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(color)
      .text(value, x + 8, y + 30, {
        width: width - 16,
      });
  }

  /**
   * Add monthly trends section
   */
  static addMonthlyTrends(doc, trends) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Monthly Collection Trends');

    doc.moveDown(0.5);

    // Table headers
    const columns = {
      month: { x: 50, width: 150 },
      amount: { x: 200, width: 120 },
      count: { x: 320, width: 80 },
    };

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');

    // Header background
    doc.fillColor('#1976D2').rect(columns.month.x - 5, doc.y, 400, 20).fill();

    doc.text('Month', columns.month.x, doc.y + 5);
    doc.text('Amount (₹)', columns.amount.x, doc.y + 5);
    doc.text('Transactions', columns.count.x, doc.y + 5);

    doc.moveDown(1);

    // Data rows
    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    trends.forEach((trend, index) => {
      if (index % 2 === 0) {
        doc.fillColor('#F5F5F5').rect(columns.month.x - 5, doc.y, 400, 20).fill();
      }

      doc.fillColor('#000000');
      doc.text(trend.month, columns.month.x, doc.y + 5);
      doc.text(
        `₹${trend.amount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        columns.amount.x,
        doc.y - 15
      );
      doc.text(trend.count.toString(), columns.count.x, doc.y - 15);

      doc.moveDown(1);
    });
  }

  /**
   * Add payment method distribution section
   */
  static addPaymentMethodDistribution(doc, paymentMethods) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Payment Method Distribution');

    doc.moveDown(0.5);

    const columns = {
      method: { x: 50, width: 150 },
      amount: { x: 200, width: 120 },
      count: { x: 320, width: 80 },
    };

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');

    // Header background
    doc.fillColor('#1976D2').rect(columns.method.x - 5, doc.y, 400, 20).fill();

    doc.text('Payment Method', columns.method.x, doc.y + 5);
    doc.text('Amount (₹)', columns.amount.x, doc.y + 5);
    doc.text('Count', columns.count.x, doc.y + 5);

    doc.moveDown(1);

    // Data rows
    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    paymentMethods.forEach((method, index) => {
      if (index % 2 === 0) {
        doc.fillColor('#F5F5F5').rect(columns.method.x - 5, doc.y, 400, 20).fill();
      }

      doc.fillColor('#000000');
      doc.text(method.method, columns.method.x, doc.y + 5);
      doc.text(
        `₹${method.amount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        columns.amount.x,
        doc.y - 15
      );
      doc.text(method.count.toString(), columns.count.x, doc.y - 15);

      doc.moveDown(1);
    });

    doc.moveDown(0.5);
  }

  /**
   * Add recent transactions section
   */
  static addRecentTransactions(doc, transactions) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Recent Transactions');

    doc.moveDown(0.5);

    const columns = {
      student: { x: 50, width: 130 },
      amount: { x: 180, width: 100 },
      method: { x: 280, width: 90 },
      date: { x: 370, width: 80 },
    };

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');

    // Header background
    doc.fillColor('#1976D2').rect(columns.student.x - 5, doc.y, 350, 20).fill();

    doc.text('Student', columns.student.x, doc.y + 5);
    doc.text('Amount', columns.amount.x, doc.y + 5);
    doc.text('Method', columns.method.x, doc.y + 5);
    doc.text('Date', columns.date.x, doc.y + 5);

    doc.moveDown(1);

    // Data rows
    doc.fontSize(8).font('Helvetica').fillColor('#000000');
    transactions.forEach((transaction, index) => {
      if (index % 2 === 0) {
        doc.fillColor('#F5F5F5').rect(columns.student.x - 5, doc.y, 350, 20).fill();
      }

      doc.fillColor('#000000');
      doc.text(
        transaction.studentName.substring(0, 20),
        columns.student.x,
        doc.y + 5
      );
      doc.text(
        `₹${parseFloat(transaction.amount).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        columns.amount.x,
        doc.y - 15
      );
      doc.text(transaction.paymentMethod, columns.method.x, doc.y - 15);
      doc.text(
        new Date(transaction.date).toLocaleDateString(),
        columns.date.x,
        doc.y - 15
      );

      doc.moveDown(1);
    });
  }

  /**
   * Add pending payments section
   */
  static addPendingPayments(doc, pendingPayments) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Pending Payments');

    doc.moveDown(0.5);

    const columns = {
      student: { x: 50, width: 120 },
      total: { x: 170, width: 90 },
      pending: { x: 260, width: 90 },
      status: { x: 350, width: 80 },
    };

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');

    // Header background
    doc.fillColor('#F57C00').rect(columns.student.x - 5, doc.y, 340, 20).fill();

    doc.text('Student', columns.student.x, doc.y + 5);
    doc.text('Total', columns.total.x, doc.y + 5);
    doc.text('Pending', columns.pending.x, doc.y + 5);
    doc.text('Status', columns.status.x, doc.y + 5);

    doc.moveDown(1);

    // Data rows
    doc.fontSize(8).font('Helvetica').fillColor('#000000');
    pendingPayments.forEach((payment, index) => {
      if (index % 2 === 0) {
        doc.fillColor('#F5F5F5').rect(columns.student.x - 5, doc.y, 340, 20).fill();
      }

      doc.fillColor('#000000');
      doc.text(
        payment.studentName.substring(0, 20),
        columns.student.x,
        doc.y + 5
      );
      doc.text(
        `₹${payment.totalAmount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        columns.total.x,
        doc.y - 15
      );
      doc.text(
        `₹${payment.amountPending.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        columns.pending.x,
        doc.y - 15
      );
      doc.text(payment.status, columns.status.x, doc.y - 15);

      doc.moveDown(1);
    });
  }

  /**
   * Add refund requests section
   */
  static addRefundRequests(doc, refundRequests) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Refund Requests');

    doc.moveDown(0.5);

    const columns = {
      student: { x: 50, width: 120 },
      amount: { x: 170, width: 90 },
      reason: { x: 260, width: 120 },
      status: { x: 380, width: 70 },
    };

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');

    // Header background
    doc.fillColor('#1976D2').rect(columns.student.x - 5, doc.y, 410, 20).fill();

    doc.text('Student', columns.student.x, doc.y + 5);
    doc.text('Amount', columns.amount.x, doc.y + 5);
    doc.text('Reason', columns.reason.x, doc.y + 5);
    doc.text('Status', columns.status.x, doc.y + 5);

    doc.moveDown(1);

    // Data rows
    doc.fontSize(8).font('Helvetica').fillColor('#000000');
    refundRequests.forEach((refund, index) => {
      if (index % 2 === 0) {
        doc.fillColor('#F5F5F5').rect(columns.student.x - 5, doc.y, 410, 20).fill();
      }

      doc.fillColor('#000000');
      doc.text(
        refund.studentName.substring(0, 20),
        columns.student.x,
        doc.y + 5
      );
      doc.text(
        `₹${refund.amount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        columns.amount.x,
        doc.y - 15
      );
      doc.text(refund.reason.substring(0, 15), columns.reason.x, doc.y - 15);
      doc.text(refund.status, columns.status.x, doc.y - 15);

      doc.moveDown(1);
    });
  }

  /**
   * Add footer to PDF
   */
  static addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Bottom border
      doc
        .moveTo(40, 750)
        .lineTo(555, 750)
        .stroke('#CCCCCC');

      // Footer text
      doc
        .fontSize(9)
        .fillColor('#999999')
        .text(
          'This is an auto-generated report from Fee Management System',
          50,
          760,
          { align: 'left' }
        );

      doc.text(
        `Page ${i + 1} of ${pageCount}`,
        450,
        760,
        { align: 'right' }
      );
    }
  }
}

export default PDFGenerator;
