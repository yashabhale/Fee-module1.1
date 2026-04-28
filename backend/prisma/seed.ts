import prisma from '../src/config/database';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@2024', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@feesystem.com' },
    update: {},
    create: {
      email: 'admin@feesystem.com',
      phone: '9999999999',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPassword,
      role: 'ADMIN',
      departmentName: 'Administration',
    },
  });

  console.log('✓ Admin user created:', admin.email);

  // Create accountant user
  const accountantPassword = await bcrypt.hash('Accountant@2024', 10);
  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@feesystem.com' },
    update: {},
    create: {
      email: 'accountant@feesystem.com',
      phone: '9999999998',
      firstName: 'Accountant',
      lastName: 'User',
      password: accountantPassword,
      role: 'ACCOUNTANT',
      departmentName: 'Finance',
    },
  });

  console.log('✓ Accountant user created:', accountant.email);

  // Create sample courses
  const courses = await Promise.all([
    prisma.course.upsert({
      where: { code: 'BSC' },
      update: {},
      create: {
        name: 'Bachelor of Science',
        code: 'BSC',
        description: '3-year undergraduate program',
        durationValue: 3,
        durationUnit: 'Years',
      },
    }),
    prisma.course.upsert({
      where: { code: 'BCA' },
      update: {},
      create: {
        name: 'Bachelor of Computer Applications',
        code: 'BCA',
        description: '3-year undergraduate program in IT',
        durationValue: 3,
        durationUnit: 'Years',
      },
    }),
    prisma.course.upsert({
      where: { code: 'MBA' },
      update: {},
      create: {
        name: 'Master of Business Administration',
        code: 'MBA',
        description: '2-year postgraduate program',
        durationValue: 2,
        durationUnit: 'Years',
      },
    }),
  ]);

  console.log('✓ Courses created:', courses.length);

  // Create classes
  const classes = await Promise.all([
    prisma.class.upsert({
      where: { code_courseId: { code: 'BSC-FY', courseId: courses[0].id } },
      update: {},
      create: {
        name: 'First Year',
        code: 'BSC-FY',
        courseId: courses[0].id,
        semester: 1,
        capacity: 60,
      },
    }),
    prisma.class.upsert({
      where: { code_courseId: { code: 'BCA-FY', courseId: courses[1].id } },
      update: {},
      create: {
        name: 'First Year',
        code: 'BCA-FY',
        courseId: courses[1].id,
        semester: 1,
        capacity: 45,
      },
    }),
  ]);

  console.log('✓ Classes created:', classes.length);

  // Create fee types
  const feeTypes = await Promise.all([
    prisma.feeType.upsert({
      where: { name: 'Tuition Fee' },
      update: {},
      create: {
        name: 'Tuition Fee',
        description: 'Regular tuition charges',
      },
    }),
    prisma.feeType.upsert({
      where: { name: 'Library Fee' },
      update: {},
      create: {
        name: 'Library Fee',
        description: 'Library maintenance and resources',
      },
    }),
    prisma.feeType.upsert({
      where: { name: 'Laboratory Fee' },
      update: {},
      create: {
        name: 'Laboratory Fee',
        description: 'Lab equipment and materials',
      },
    }),
    prisma.feeType.upsert({
      where: { name: 'Exam Fee' },
      update: {},
      create: {
        name: 'Exam Fee',
        description: 'Examination fees',
      },
    }),
  ]);

  console.log('✓ Fee types created:', feeTypes.length);

  // Create fee structure for BSC-FY
  const feeStructure = await prisma.feeStructure.upsert({
    where: {
      courseId_classId_academicYear: {
        courseId: courses[0].id,
        classId: classes[0].id,
        academicYear: '2024-2025',
      },
    },
    update: {},
    create: {
      courseId: courses[0].id,
      classId: classes[0].id,
      academicYear: '2024-2025',
      totalFee: 120000,
      paymentTerms: 'Annually',
      dueDate: new Date('2024-07-31'),
      gracePeriodDays: 15,
      penaltyPerDay: 100,
      components: {
        create: [
          {
            feeTypeId: feeTypes[0].id,
            amount: 80000,
          },
          {
            feeTypeId: feeTypes[1].id,
            amount: 15000,
          },
          {
            feeTypeId: feeTypes[2].id,
            amount: 15000,
          },
          {
            feeTypeId: feeTypes[3].id,
            amount: 10000,
          },
        ],
      },
    },
  });

  console.log('✓ Fee structure created');

  // Create sample parent
  const parent = await prisma.parent.upsert({
    where: { phone: '8888888888' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '8888888888',
      email: 'parent@example.com',
      relationship: 'Father',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
    },
  });

  console.log('✓ Parent created');

  // Create sample students
  const student = await prisma.student.upsert({
    where: { studentId: 'STU001' },
    update: {},
    create: {
      studentId: 'STU001',
      firstName: 'Rahul',
      lastName: 'Kumar',
      email: 'rahul@example.com',
      phone: '9876543210',
      courseId: courses[0].id,
      classId: classes[0].id,
      parentId: parent.id,
      enrollmentDate: new Date('2024-06-01'),
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      gender: 'Male',
    },
  });

  console.log('✓ Sample student created:', student.studentId);

  // Create fee payment records for the student
  const feePayment1 = await prisma.feePayment.create({
    data: {
      studentId: student.id,
      feeStructureId: feeStructure.id,
      totalAmount: 120000,
      amountPaid: 60000,
      amountPending: 60000,
      dueDate: new Date('2024-07-31'),
      paymentStatus: 'PARTIAL',
      notes: 'Partial payment received',
    },
  });

  console.log('✓ Fee payment created: PARTIAL');

  // Create payment transaction records
  await prisma.payment.create({
    data: {
      feePaymentId: feePayment1.id,
      amount: 40000,
      paymentMethod: 'ONLINE',
      transactionId: 'TXN001',
      notes: 'Online transfer',
    },
  });

  await prisma.payment.create({
    data: {
      feePaymentId: feePayment1.id,
      amount: 20000,
      paymentMethod: 'CHEQUE',
      transactionId: 'CHQ001',
      notes: 'Cheque payment',
    },
  });

  console.log('✓ Payment transactions created: 2');

  // Create more students with different payment statuses for dashboard variety
  const student2 = await prisma.student.upsert({
    where: { studentId: 'STU002' },
    update: {},
    create: {
      studentId: 'STU002',
      firstName: 'Priya',
      lastName: 'Singh',
      email: 'priya@example.com',
      phone: '9876543211',
      courseId: courses[0].id,
      classId: classes[0].id,
      parentId: parent.id,
      enrollmentDate: new Date('2024-06-01'),
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      gender: 'Female',
    },
  });

  // Paid fee payment
  await prisma.feePayment.create({
    data: {
      studentId: student2.id,
      feeStructureId: feeStructure.id,
      totalAmount: 120000,
      amountPaid: 120000,
      amountPending: 0,
      dueDate: new Date('2024-07-31'),
      paymentStatus: 'PAID',
      notes: 'Full payment received',
    },
  });

  console.log('✓ Paid fee payment created');

  // Create another student with pending fee
  const student3 = await prisma.student.upsert({
    where: { studentId: 'STU003' },
    update: {},
    create: {
      studentId: 'STU003',
      firstName: 'Arun',
      lastName: 'Patel',
      email: 'arun@example.com',
      phone: '9876543212',
      courseId: courses[1].id,
      classId: classes[1].id,
      parentId: parent.id,
      enrollmentDate: new Date('2024-06-15'),
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      gender: 'Male',
    },
  });

  // Pending fee payment
  await prisma.feePayment.create({
    data: {
      studentId: student3.id,
      feeStructureId: feeStructure.id,
      totalAmount: 120000,
      amountPaid: 0,
      amountPending: 120000,
      dueDate: new Date('2024-07-31'),
      paymentStatus: 'PENDING',
      notes: 'Payment pending',
    },
  });

  console.log('✓ Pending fee payment created');

  console.log('✅ Database seeding completed successfully!');
  console.log('📊 Sample Data Summary:');
  console.log('   - 3 Students created (STU001, STU002, STU003)');
  console.log('   - Fee Payment Status: PARTIAL (₹60K collected), PAID (₹120K), PENDING (₹120K)');
  console.log('   - Total Collected: ₹180,000');
  console.log('   - Total Pending: ₹180,000');
}

(async () => {
  try {
    await main();
  } catch (e) {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
