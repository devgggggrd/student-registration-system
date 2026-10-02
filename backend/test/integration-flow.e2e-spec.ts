import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { DayOfWeek, EnrollmentStatus, SemesterStatus } from '@prisma/client';

jest.setTimeout(120000);

describe('Cross-Module Integration Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;

  let activeSemesterId: string;
  let teacherId: string;
  let departmentId: string;
  let studentId: string;

  let createdCourseId: string;
  let createdSectionId: string;
  let createdEnrollmentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // 1. Login Admin
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@reg.edu', password: 'Admin@1234' });
    adminToken = adminRes.body.accessToken;

    // 2. Login Teacher (Alan Turing: teacher1@reg.edu)
    const teacherRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'teacher1@reg.edu', password: 'Password@123' });
    teacherToken = teacherRes.body.accessToken;

    // 3. Login Student (Jane Smith: student2@reg.edu)
    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student2@reg.edu', password: 'Password@123' });
    studentToken = studentRes.body.accessToken;

    // Get active semester, teacher, department, student IDs
    const semester = await prisma.semester.findFirst({
      where: { status: SemesterStatus.OPEN },
    });
    activeSemesterId = semester!.id;

    const teacher = await prisma.teacher.findUnique({
      where: { teacherCode: 'T001' },
    });
    teacherId = teacher!.id;

    const dept = await prisma.department.findUnique({
      where: { code: 'CS' },
    });
    departmentId = dept!.id;

    const studentUser = await prisma.user.findUnique({
      where: { email: 'student2@reg.edu' },
      include: { student: true },
    });
    studentId = studentUser!.student!.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    if (createdSectionId) {
      await prisma.enrollment.deleteMany({
        where: { courseSectionId: createdSectionId },
      });
      await prisma.schedule.deleteMany({
        where: { courseSectionId: createdSectionId },
      });
      await prisma.courseSection.deleteMany({
        where: { id: createdSectionId },
      });
    }
    if (createdCourseId) {
      await prisma.course.deleteMany({
        where: { id: createdCourseId },
      });
    }

    await app.close();
  });

  describe('Full Cross-Role User Lifecycle Integration', () => {
    it('Step 1: Admin creates a new course and section with schedule', async () => {
      // 1. Admin creates course
      const courseCode = `INT${Date.now().toString().slice(-4)}`;
      const courseRes = await request(app.getHttpServer())
        .post('/api/v1/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseCode,
          courseName: 'Cross-Module Cloud Integration',
          credits: 3,
          departmentId,
          description: 'Full end-to-end integration test course',
        })
        .expect(201);

      expect(courseRes.body).toHaveProperty('id');
      expect(courseRes.body.courseCode).toBe(courseCode);
      createdCourseId = courseRes.body.id;

      // 2. Admin creates section with schedule
      const sectionRes = await request(app.getHttpServer())
        .post('/api/v1/admin/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: createdCourseId,
          semesterId: activeSemesterId,
          sectionNumber: 1,
          teacherId,
          capacity: 25,
          room: 'Lab Cloud-1',
          schedules: [
            {
              dayOfWeek: DayOfWeek.FRIDAY,
              startTime: '13:00',
              endTime: '16:00',
              room: 'Lab Cloud-1',
            },
          ],
        })
        .expect(201);

      expect(sectionRes.body).toHaveProperty('id');
      expect(sectionRes.body.capacity).toBe(25);
      expect(sectionRes.body.schedules).toHaveLength(1);
      createdSectionId = sectionRes.body.id;
    });

    it('Step 2: Student discovers the course, enrolls, and verifies timetable and credits', async () => {
      // 1. Student searches for courses
      const searchRes = await request(app.getHttpServer())
        .get('/api/v1/student/courses?search=Cross-Module')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(searchRes.body.courses).toHaveLength(1);
      const targetCourse = searchRes.body.courses[0];
      expect(targetCourse.id).toBe(createdCourseId);
      expect(targetCourse.sections).toHaveLength(1);
      expect(targetCourse.sections[0].id).toBe(createdSectionId);
      expect(targetCourse.sections[0].remainingSeats).toBe(25);

      // 2. Student registers for section
      const enrollRes = await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseSectionId: createdSectionId })
        .expect(201);

      expect(enrollRes.body).toHaveProperty('enrollment');
      expect(enrollRes.body.enrollment.status).toBe('REGISTERED');
      createdEnrollmentId = enrollRes.body.enrollment.id;

      // 3. Student verifies schedule timetable
      const schedRes = await request(app.getHttpServer())
        .get('/api/v1/student/schedule')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(schedRes.body).toHaveProperty('slots');
      expect(Array.isArray(schedRes.body.slots)).toBe(true);
      const matchingSlot = schedRes.body.slots.find((s: any) => s.courseCode === targetCourse.courseCode);
      expect(matchingSlot).toBeDefined();
      expect(matchingSlot.dayOfWeek).toBe(DayOfWeek.FRIDAY);
      expect(matchingSlot.startTime).toBe('13:00');
      expect(matchingSlot.endTime).toBe('16:00');

      // 4. Student verifies profile summary stats
      const profileRes = await request(app.getHttpServer())
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(profileRes.body.stats.enrolledCoursesCount).toBeGreaterThanOrEqual(1);
      expect(profileRes.body.stats.totalRegisteredCredits).toBeGreaterThanOrEqual(3);
    });

    it('Step 3: Teacher inspects assigned section roster and confirms student presence', async () => {
      // 1. Teacher views assigned sections
      const sectionsRes = await request(app.getHttpServer())
        .get('/api/v1/teacher/sections')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const assignedSection = sectionsRes.body.find((s: any) => s.id === createdSectionId);
      expect(assignedSection).toBeDefined();
      expect(assignedSection.enrolledCount).toBe(1);

      // 2. Teacher views section roster
      const rosterRes = await request(app.getHttpServer())
        .get(`/api/v1/teacher/sections/${createdSectionId}/roster`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(rosterRes.body.section.id).toBe(createdSectionId);
      expect(rosterRes.body.students).toHaveLength(1);
      expect(rosterRes.body.students[0].student.studentCode).toBe('6601002');
      expect(rosterRes.body.students[0].student.firstName).toBe('Jane');
      expect(rosterRes.body.students[0].status).toBe(EnrollmentStatus.REGISTERED);
    });

    it('Step 4: Student drops course and verifies seat count restored', async () => {
      // 1. Student drops course
      const dropRes = await request(app.getHttpServer())
        .delete(`/api/v1/student/enrollments/${createdEnrollmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(dropRes.body.enrollment.status).toBe(EnrollmentStatus.DROPPED);

      // 2. Teacher re-checks roster: enrollment is recorded as DROPPED
      const rosterRes = await request(app.getHttpServer())
        .get(`/api/v1/teacher/sections/${createdSectionId}/roster`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(rosterRes.body.students).toHaveLength(1);
      expect(rosterRes.body.students[0].status).toBe(EnrollmentStatus.DROPPED);

      // 3. Student re-checks courses: remainingSeats is 25 again
      const searchRes = await request(app.getHttpServer())
        .get('/api/v1/student/courses?search=Cross-Module')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(searchRes.body.courses[0].sections[0].remainingSeats).toBe(25);
    });

    it('Step 5: Admin inspects audit logs for system governance traceability', async () => {
      const logsRes = await request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs?take=20')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(logsRes.body)).toBe(true);
      expect(logsRes.body.length).toBeGreaterThan(0);

      // Confirm REGISTER_COURSE action was recorded
      const regLog = logsRes.body.find((l: any) => l.action === 'REGISTER_COURSE');
      expect(regLog).toBeDefined();
    });
  });
});
