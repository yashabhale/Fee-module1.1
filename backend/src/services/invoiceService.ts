import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';

export class InvoiceService {
  async getInvoiceById(invoiceId: string) {
    const feePayment = await prisma.feePayment.findUnique({
      where: { id: invoiceId },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            parent: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                relationship: true,
              },
            },
          },
        },
        feeStructure: {
          select: {
            id: true,
            academicYear: true,
            components: {
              include: {
                feeType: {
                  select: {
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            transactionId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!feePayment) {
      throw new NotFoundError('Invoice not found');
    }

    const student = feePayment.student;
    const feeStructure = feePayment.feeStructure;
    const parent = student.parent;

    const feeBreakdown = feeStructure.components.map((component) => ({
      description: component.feeType.name,
      amount: Number(component.amount),
    }));

    const totalAmount = Number(feePayment.totalAmount);
    const amountPaid = Number(feePayment.amountPaid);
    const status = feePayment.paymentStatus;

    return {
      invoiceId: feePayment.id,
      invoiceDate: feePayment.createdAt.toISOString().split('T')[0],
      studentName: `${student.firstName} ${student.lastName}`,
      class: feeStructure.academicYear,
      rollNumber: student.studentId,
      parentName: parent ? `${parent.firstName} ${parent.lastName}` : 'N/A',
      email: student.email || 'N/A',
      phone: student.phone || 'N/A',
      feeBreakdown,
      totalAmount,
      paidAmount: amountPaid,
      status: status === 'PAID' ? 'Paid' : status === 'PARTIAL' ? 'Partially Paid' : status === 'PENDING' ? 'Pending' : status === 'OVERDUE' ? 'Overdue' : 'Failed',
      paymentDate: feePayment.payments[0]?.createdAt || null,
      dueDate: feePayment.dueDate.toISOString().split('T')[0],
      amountPending: totalAmount - amountPaid,
      payments: feePayment.payments,
    };
  }

  async getAllInvoices(page: number = 1, limit: number = 10, filters: any = {}) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.paymentStatus = filters.status;
    }
    if (filters.studentId) {
      where.studentId = filters.studentId;
    }
    if (filters.courseId) {
      where.feeStructure = { courseId: filters.courseId };
    }

    const [invoices, total] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        include: {
          student: {
            select: {
              studentId: true,
              firstName: true,
              lastName: true,
            },
          },
          feeStructure: {
            select: {
              academicYear: true,
            },
          },
          payments: {
            select: {
              amount: true,
              paymentMethod: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.feePayment.count({ where }),
    ]);

    return {
      invoices: invoices.map((inv) => ({
        invoiceId: inv.id,
        invoiceDate: inv.createdAt.toISOString().split('T')[0],
        studentName: `${inv.student.firstName} ${inv.student.lastName}`,
        class: inv.feeStructure.academicYear,
        rollNumber: inv.student.studentId,
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.amountPaid),
        status: inv.paymentStatus,
        dueDate: inv.dueDate.toISOString().split('T')[0],
        lastPaymentDate: inv.payments[0]?.createdAt || null,
        lastPaymentAmount: inv.payments[0]?.amount || 0,
      })),
      total,
      page,
      limit,
    };
  }

  async createInvoice(data: {
    studentId: string;
    feeStructureId: string;
    totalAmount: number;
    dueDate: Date;
    approvedBy?: string;
    notes?: string;
  }) {
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
    });

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: data.feeStructureId },
    });

    if (!feeStructure) {
      throw new NotFoundError('Fee structure not found');
    }

    const invoice = await prisma.feePayment.create({
      data: {
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        totalAmount: data.totalAmount,
        amountPaid: 0,
        amountPending: data.totalAmount,
        dueDate: data.dueDate,
        paymentStatus: 'PENDING',
        approvedBy: data.approvedBy,
        notes: data.notes,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        feeStructure: {
          select: {
            id: true,
            academicYear: true,
            components: {
              include: {
                feeType: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return invoice;
  }

  async bulkCreateInvoices(invoices: Array<{
    studentId: string;
    feeStructureId: string;
    totalAmount: number;
    dueDate: Date;
  }>) {
    const results = [];
    const errors = [];

    for (const invoiceData of invoices) {
      try {
        const invoice = await this.createInvoice(invoiceData);
        results.push(invoice);
      } catch (error: any) {
        errors.push({
          data: invoiceData,
          error: error.message,
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }
}

export default new InvoiceService();
