import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, StudentStatus, SemesterStatus, EnrollmentStatus, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Starting Database Seed ---');

  // Clear existing data in reverse order of foreign key dependencies
  await prisma.auditLog.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.courseSection.deleteMany();
  await prisma.course.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 10);

  // 1. Create Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@reg.edu',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log('✓ Created Admin:', adminUser.email);

  // 2. Create Departments
  const deptCS = await prisma.department.create({
    data: {
      code: 'CS',
      name: 'Computer Science',
    },
  });

  const deptSE = await prisma.department.create({
    data: {
      code: 'SE',
      name: 'Software Engineering',
    },
  });
  console.log('✓ Created Departments: CS, SE');

  // 3. Create Teachers
  const teacherUser1 = await prisma.user.create({
    data: {
      email: 'teacher1@reg.edu',
      passwordHash: defaultPasswordHash,
      role: Role.TEACHER,
    },
  });

  const teacher1 = await prisma.teacher.create({
    data: {
      userId: teacherUser1.id,
      teacherCode: 'T001',
      firstName: 'Alan',
      lastName: 'Turing',
      departmentId: deptCS.id,
    },
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      email: 'teacher2@reg.edu',
      passwordHash: defaultPasswordHash,
      role: Role.TEACHER,
    },
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacherUser2.id,
      teacherCode: 'T002',
      firstName: 'Grace',
      lastName: 'Hopper',
      departmentId: deptSE.id,
    },
  });
  console.log('✓ Created Teachers: Alan Turing, Grace Hopper');

  // 4. Create Students
  const studentUser1 = await prisma.user.create({
    data: {
      email: 'student1@reg.edu',
      passwordHash: defaultPasswordHash,
      role: Role.STUDENT,
    },
  });

  const student1 = await prisma.student.create({
    data: {
      userId: studentUser1.id,
      studentCode: '6601001',
      firstName: 'John',
      lastName: 'Doe',
      departmentId: deptCS.id,
      yearLevel: 2,
      status: StudentStatus.ACTIVE,
    },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      email: 'student2@reg.edu',
      passwordHash: defaultPasswordHash,
      role: Role.STUDENT,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      userId: studentUser2.id,
      studentCode: '6601002',
      firstName: 'Jane',
      lastName: 'Smith',
      departmentId: deptCS.id,
      yearLevel: 2,
      status: StudentStatus.ACTIVE,
    },
  });

  const studentUser3 = await prisma.user.create({
    data: {
      email: 'student3@reg.edu',
      passwordHash: defaultPasswordHash,
      role: Role.STUDENT,
    },
  });

  const student3 = await prisma.student.create({
    data: {
      userId: studentUser3.id,
      studentCode: '6501001',
      firstName: 'Bob',
      lastName: 'Johnson',
      departmentId: deptSE.id,
      yearLevel: 3,
      status: StudentStatus.ACTIVE,
    },
  });
  console.log('✓ Created Students: 6601001 (John), 6601002 (Jane), 6501001 (Bob)');

  // 5. Create Courses
  const courseCS101 = await prisma.course.create({
    data: {
      courseCode: 'CS101',
      courseName: 'Introduction to Programming',
      credits: 3,
      departmentId: deptCS.id,
      description: 'Fundamental concepts of procedural and object-oriented programming.',
    },
  });

  const courseCS102 = await prisma.course.create({
    data: {
      courseCode: 'CS102',
      courseName: 'Data Structures and Algorithms',
      credits: 3,
      departmentId: deptCS.id,
      description: 'Design and analysis of basic data structures and algorithms.',
    },
  });

  const courseCS201 = await prisma.course.create({
    data: {
      courseCode: 'CS201',
      courseName: 'Database Systems',
      credits: 3,
      departmentId: deptCS.id,
      description: 'Relational database design, SQL, normalization, and ACID transactions.',
    },
  });

  const courseSE201 = await prisma.course.create({
    data: {
      courseCode: 'SE201',
      courseName: 'Software Engineering Principles',
      credits: 3,
      departmentId: deptSE.id,
      description: 'Software development lifecycle, Agile methodologies, and design patterns.',
    },
  });

  const courseSE301 = await prisma.course.create({
    data: {
      courseCode: 'SE301',
      courseName: 'Web Application Development',
      credits: 3,
      departmentId: deptSE.id,
      description: 'Fullstack modern web development with TypeScript, React, and NestJS.',
    },
  });
  console.log('✓ Created Courses: CS101, CS102, CS201, SE201, SE301');

  // 6. Create Current Semester (OPEN for registration)
  const now = new Date();
  const regStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  const regEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);  // 14 days from now
  const termStart = new Date('2026-10-01');
  const termEnd = new Date('2027-02-28');

  const semester = await prisma.semester.create({
    data: {
      academicYear: 2026,
      semesterNumber: 1,
      registrationStart: regStart,
      registrationEnd: regEnd,
      startDate: termStart,
      endDate: termEnd,
      status: SemesterStatus.OPEN,
    },
  });
  console.log('✓ Created Semester: 2026/1 (OPEN)');

  // 7. Create Course Sections
  const secCS101_1 = await prisma.courseSection.create({
    data: {
      courseId: courseCS101.id,
      semesterId: semester.id,
      sectionNumber: 1,
      teacherId: teacher1.id,
      capacity: 35,
      room: 'Lab 301',
    },
  });

  const secCS101_2 = await prisma.courseSection.create({
    data: {
      courseId: courseCS101.id,
      semesterId: semester.id,
      sectionNumber: 2,
      teacherId: teacher2.id,
      capacity: 30,
      room: 'Lab 302',
    },
  });

  const secCS201_1 = await prisma.courseSection.create({
    data: {
      courseId: courseCS201.id,
      semesterId: semester.id,
      sectionNumber: 1,
      teacherId: teacher1.id,
      capacity: 40,
      room: 'Lecture 401',
    },
  });

  const secSE201_1 = await prisma.courseSection.create({
    data: {
      courseId: courseSE201.id,
      semesterId: semester.id,
      sectionNumber: 1,
      teacherId: teacher2.id,
      capacity: 40,
      room: 'Lecture 402',
    },
  });
  console.log('✓ Created Sections: CS101(Sec1, Sec2), CS201(Sec1), SE201(Sec1)');

  // 8. Create Schedules
  await prisma.schedule.createMany({
    data: [
      {
        courseSectionId: secCS101_1.id,
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '09:00',
        endTime: '12:00',
        room: 'Lab 301',
      },
      {
        courseSectionId: secCS101_2.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        startTime: '13:00',
        endTime: '16:00',
        room: 'Lab 302',
      },
      {
        courseSectionId: secCS201_1.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        startTime: '09:00',
        endTime: '12:00',
        room: 'Lecture 401',
      },
      {
        courseSectionId: secSE201_1.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        startTime: '13:00',
        endTime: '16:00',
        room: 'Lecture 402',
      },
    ],
  });
  console.log('✓ Created Schedules for all sections');

  // 9. Initial Sample Enrollment (John Doe in CS101 Sec 1)
  await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      courseSectionId: secCS101_1.id,
      semesterId: semester.id,
      status: EnrollmentStatus.REGISTERED,
    },
  });
  console.log('✓ Created Initial Enrollment: John Doe -> CS101 Sec 1');

  // 10. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'DATABASE_INITIAL_SEED',
      entity: 'SYSTEM',
      entityId: 'V1',
      details: {
        departmentsCount: 2,
        coursesCount: 5,
        semester: '2026/1',
      },
      ipAddress: '127.0.0.1',
    },
  });
  console.log('✓ Created Initial Audit Log');

  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
