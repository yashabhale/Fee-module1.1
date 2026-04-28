import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import { StudentStatus } from '@prisma/client';

export class StudentService {
  async createStudent(data: {
    studentId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    courseId: string;
    classId: string;
    parentId?: string;
  }) {
    // Check if student already exists
    const existing = await prisma.student.findUnique({
      where: { studentId: data.studentId },
    });

    if (existing) {
      throw new ConflictError('Student ID already exists');
    }

    // Check if course and class exist
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const classRecord = await prisma.class.findUnique({
      where: { id: data.classId },
    });

    if (!classRecord) {
      throw new NotFoundError('Class not found');
    }

    const student = await prisma.student.create({
      data: {
        ...data,
        enrollmentDate: new Date(),
      },
      include: {
        course: true,
        class: true,
        parent: true,
      },
    });

    return student;
  }

  async getStudentById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        course: true,
        class: true,
        parent: true,
        feePayments: {
          select: {
            id: true,
            totalAmount: true,
            amountPaid: true,
            paymentStatus: true,
            dueDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    return student;
  }

  async updateStudent(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    }>
  ) {
    const student = await prisma.student.update({
      where: { id },
      data,
      include: {
        course: true,
        class: true,
      },
    });

    return student;
  }

  async deleteStudent(id: string) {
    const student = await prisma.student.delete({
      where: { id },
    });

    return student;
  }

  async searchStudents(
    {
      search,
      status,
      city,
      courseId,
      classId,
      page = 1,
      limit = 10,
    }: {
      search?: string;
      status?: StudentStatus;
      city?: string;
      courseId?: string;
      classId?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { studentId: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (courseId) where.courseId = courseId;
    if (classId) where.classId = classId;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          course: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true, code: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    return { students, total, page, limit };
  }

  async bulkCreateStudents(
    data: Array<{
      studentId: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      city?: string;
      state?: string;
      courseId: string;
      classId: string;
      parentPhone?: string;
    }>
  ) {
    const results = { created: 0, failed: 0, errors: [] as any[] };

    for (const studentData of data) {
      try {
        // Prepare parent if phone is provided
        let parentId: string | undefined;
        if (studentData.parentPhone) {
          let parent = await prisma.parent.findFirst({
            where: { phone: studentData.parentPhone },
          });

          if (!parent) {
            parent = await prisma.parent.create({
              data: {
                firstName: 'Parent',
                lastName: 'Of ' + studentData.firstName,
                phone: studentData.parentPhone,
              },
            });
          }

          parentId = parent.id;
        }

        const { parentPhone, ...createData } = studentData;

        // Try to create student
        const existing = await prisma.student.findUnique({
          where: { studentId: studentData.studentId },
        });

        if (!existing) {
          await prisma.student.create({
            data: {
              ...createData,
              parentId,
              enrollmentDate: new Date(),
            },
          });

          results.created++;
        } else {
          results.errors.push({
            studentId: studentData.studentId,
            reason: 'Student ID already exists',
          });
          results.failed++;
        }
      } catch (error: any) {
        results.errors.push({
          studentId: studentData.studentId,
          reason: error.message,
        });
        results.failed++;
      }
    }

    return results;
  }

  async getStudentStats() {
    const totalStudents = await prisma.student.count();
    const activeStudents = await prisma.student.count({
      where: { status: 'ACTIVE' },
    });
    const studentsByCourse = await prisma.student.groupBy({
      by: ['courseId'],
      _count: true,
    });

    return {
      total: totalStudents,
      active: activeStudents,
      byCourse: studentsByCourse,
    };
  }
}

export default new StudentService();
