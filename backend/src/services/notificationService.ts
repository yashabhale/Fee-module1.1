import prisma from '../config/database';
import { NotFoundError } from '../middleware/errorHandler';
import logger from '../config/logger';

export class NotificationService {
  async sendWhatsAppNotification(invoiceId: string) {
    const invoice = await prisma.feePayment.findUnique({
      where: { id: invoiceId },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            parent: {
              select: {
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    const student = invoice.student;
    const phone = student.parent?.phone || student.phone;

    if (!phone) {
      throw new NotFoundError('No phone number found for this student');
    }

    const totalAmount = Number(invoice.totalAmount);
    const amountPaid = Number(invoice.amountPaid);
    const pending = totalAmount - amountPaid;

    const message = `Hello ${student.firstName} ${student.lastName}, your pending fee is ₹${pending.toLocaleString()}. Please pay soon.`;

    logger.info('WhatsApp notification sent', { invoiceId, phone, message });

    return {
      success: true,
      channel: 'whatsapp',
      phone,
      message,
      invoiceId,
      sentAt: new Date().toISOString(),
    };
  }

  async sendSMSNotification(invoiceId: string) {
    const invoice = await prisma.feePayment.findUnique({
      where: { id: invoiceId },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            parent: {
              select: {
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    const student = invoice.student;
    const phone = student.parent?.phone || student.phone;

    if (!phone) {
      throw new NotFoundError('No phone number found for this student');
    }

    const totalAmount = Number(invoice.totalAmount);
    const amountPaid = Number(invoice.amountPaid);
    const pending = totalAmount - amountPaid;

    const message = `Hello ${student.firstName}, your pending fee is Rs.${pending.toLocaleString()}. Please pay soon.`;

    logger.info('SMS notification sent', { invoiceId, phone, message });

    return {
      success: true,
      channel: 'sms',
      phone,
      message,
      invoiceId,
      sentAt: new Date().toISOString(),
    };
  }

  async sendBulkNotification(data: {
    channel: 'whatsapp' | 'sms';
    invoiceIds: string[];
    message?: string;
  }) {
    const results = [];

    for (const invoiceId of data.invoiceIds) {
      try {
        let result;
        if (data.channel === 'whatsapp') {
          result = await this.sendWhatsAppNotification(invoiceId);
        } else {
          result = await this.sendSMSNotification(invoiceId);
        }
        results.push({ invoiceId, success: true, data: result });
      } catch (error: any) {
        results.push({
          invoiceId,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    logger.info('Bulk notification sent', {
      channel: data.channel,
      total: results.length,
      success: successCount,
      failed: failureCount,
    });

    return {
      success: true,
      channel: data.channel,
      total: results.length,
      successCount,
      failureCount,
      results,
    };
  }
}

export default new NotificationService();
