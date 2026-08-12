import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import logger from '../config/logger';
import csv from 'csv-parser';
import { Readable } from 'stream';

export class BulkUploadService {
  async parseCSV(fileBuffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(fileBuffer.toString());

      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  async uploadFeeStructures(csvData: any[], uploadedBy: string) {
    const results = [];
    const errors = [];

    for (const row of csvData) {
      try {
        const feeStructure = await prisma.feeStructure.create({
          data: {
            courseId: row.courseId || row.course_code,
            classId: row.classId || row.class_code,
            academicYear: row.academicYear || row.academic_year,
            totalFee: parseFloat(row.totalFee || row.total_fee || row.amount),
            paymentTerms: row.paymentTerms || row.payment_terms,
            dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
            gracePeriodDays: row.gracePeriodDays ? parseInt(row.gracePeriodDays) : 15,
            penaltyPerDay: row.penaltyPerDay ? parseFloat(row.penaltyPerDay) : 0,
          },
        });
        results.push(feeStructure);
      } catch (error: any) {
        errors.push({ row, error: error.message });
      }
    }

    await this.logUpload('Fee Structure', csvData.length, results.length, errors.length, uploadedBy);

    return { success: results.length, failed: errors.length, results, errors };
  }

  async uploadInvoices(csvData: any[], uploadedBy: string) {
    const results = [];
    const errors = [];

    for (const row of csvData) {
      try {
        const student = await prisma.student.findFirst({
          where: { studentId: row.studentId || row.student_id },
        });

        if (!student) {
          errors.push({ row, error: 'Student not found' });
          continue;
        }

        const feeStructure = await prisma.feeStructure.findFirst({
          where: {
            courseId: student.courseId,
            classId: student.classId,
            academicYear: row.academicYear || row.academic_year,
          },
        });

        if (!feeStructure) {
          errors.push({ row, error: 'Fee structure not found for student' });
          continue;
        }

        const invoice = await prisma.feePayment.create({
          data: {
            studentId: student.id,
            feeStructureId: feeStructure.id,
            totalAmount: parseFloat(row.amount || row.totalAmount),
            amountPaid: 0,
            amountPending: parseFloat(row.amount || row.totalAmount),
            dueDate: row.dueDate ? new Date(row.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paymentStatus: 'PENDING',
            approvedBy: uploadedBy,
          },
        });
        results.push(invoice);
      } catch (error: any) {
        errors.push({ row, error: error.message });
      }
    }

    await this.logUpload('Bulk Invoices', csvData.length, results.length, errors.length, uploadedBy);

    return { success: results.length, failed: errors.length, results, errors };
  }

  async uploadPayments(csvData: any[], uploadedBy: string) {
    const results = [];
    const errors = [];

    for (const row of csvData) {
      try {
        const feePayment = await prisma.feePayment.findFirst({
          where: { id: row.invoiceId || row.invoice_id },
        });

        if (!feePayment) {
          errors.push({ row, error: 'Invoice not found' });
          continue;
        }

        const payment = await prisma.payment.create({
          data: {
            feePaymentId: feePayment.id,
            amount: parseFloat(row.amount),
            paymentMethod: (row.paymentMethod || row.payment_method || 'CASH').toUpperCase(),
            transactionId: row.transactionId || row.transaction_id,
            receivedBy: uploadedBy,
            notes: row.notes,
          },
        });

        const newAmountPaid = Number(feePayment.amountPaid) + parseFloat(row.amount);
        const newAmountPending = Math.max(0, Number(feePayment.totalAmount) - newAmountPaid);
        let newStatus: any = 'PENDING';
        if (newAmountPaid >= Number(feePayment.totalAmount)) {
          newStatus = 'PAID';
        } else if (newAmountPaid > 0) {
          newStatus = 'PARTIAL';
        }

        await prisma.feePayment.update({
          where: { id: feePayment.id },
          data: {
            amountPaid: newAmountPaid,
            amountPending: newAmountPending,
            paymentStatus: newStatus,
          },
        });

        results.push(payment);
      } catch (error: any) {
        errors.push({ row, error: error.message });
      }
    }

    await this.logUpload('Payment Records', csvData.length, results.length, errors.length, uploadedBy);

    return { success: results.length, failed: errors.length, results, errors };
  }

  async uploadStudents(csvData: any[], uploadedBy: string) {
    const results = [];
    const errors = [];

    for (const row of csvData) {
      try {
        const course = await prisma.course.findFirst({
          where: { code: row.courseCode || row.course_code },
        });

        if (!course) {
          errors.push({ row, error: 'Course not found' });
          continue;
        }

        const classEntity = await prisma.class.findFirst({
          where: {
            code: row.classCode || row.class_code,
            courseId: course.id,
          },
        });

        if (!classEntity) {
          errors.push({ row, error: 'Class not found for course' });
          continue;
        }

        const student = await prisma.student.create({
          data: {
            studentId: row.studentId || row.student_id,
            firstName: row.firstName || row.first_name || row.studentName || row.student_name?.split(' ')[0] || 'Unknown',
            lastName: row.lastName || row.last_name || row.studentName || row.student_name?.split(' ')[1] || '',
            email: row.email,
            phone: row.phone,
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
            gender: row.gender,
            street: row.street || row.address,
            city: row.city,
            state: row.state,
            postalCode: row.postalCode || row.pincode,
            country: row.country || 'India',
            courseId: course.id,
            classId: classEntity.id,
            enrollmentDate: row.enrollmentDate ? new Date(row.enrollmentDate) : new Date(),
            status: 'ACTIVE',
          },
        });
        results.push(student);
      } catch (error: any) {
        errors.push({ row, error: error.message });
      }
    }

    await this.logUpload('Student Data', csvData.length, results.length, errors.length, uploadedBy);

    return { success: results.length, failed: errors.length, results, errors };
  }

  async getUploadLogs(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.bulkUploadLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bulkUploadLog.count(),
    ]);

    return { logs, total, page, limit };
  }

  private async logUpload(type: string, total: number, success: number, failed: number, uploadedBy: string) {
    await prisma.bulkUploadLog.create({
      data: {
        fileName: `${type.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`,
        totalRecords: total,
        successCount: success,
        failureCount: failed,
        status: failed === 0 ? 'COMPLETED' : 'COMPLETED',
        uploadedBy,
      },
    });
  }
}

export default new BulkUploadService();
