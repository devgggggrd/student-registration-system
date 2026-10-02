import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { DayOfWeek, EnrollmentStatus, SemesterStatus, StudentStatus } from '@prisma/client';

jest.setTimeout(120000);

describe('Advanced Business Logic & Edge Cases (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let student1Token: string;
  let student2Token: string;
  let student3Token: string;

  let activeSemesterId: string;
  let teacherId: string;
  let departmentId: string;

  const createdCourseIds: string[] = [];
  const createdSectionIds: string[] = [];

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

    // Login Student 1
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student1@reg.edu', password: 'Password@123' });
    student1Token = res1.body.accessToken;

    // Login Student 2
    const res2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student2@reg.edu', password: 'Password@123' });
    student2Token = res2.body.accessToken;

    // Login Student 3
    const res3 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student3@reg.edu', password: 'Password@123' });
    student3Token = res3.body.accessToken;

    // Find active semester, department, and teacher
    let semester = await prisma.semester.findFirst({
      where: { status: SemesterStatus.OPEN },
    });
    if (!semester) {
      semester = await prisma.semester.create({
        data: {
          academicYear: 2026,
          semesterNumber: 1,
          registrationStart: new Date(Date.now() - 3600000),
          registrationEnd: new Date(Date.now() + 86400000 * 30),
          startDate: new Date('2026-08-15'),
          endDate: new Date('2026-12-15'),
          status: SemesterStatus.OPEN,
        },
      });
    }
    activeSemesterId = semester.id;

    const teacher = await prisma.teacher.findFirst();
    teacherId = teacher!.id;

    const dept = await prisma.department.findFirst();
    departmentId = dept!.id;
  });

  afterAll(async () => {
    // Cleanup created test sections and courses
    if (createdSectionIds.length > 0) {
      await prisma.enrollment.deleteMany({
        where: { courseSectionId: { in: createdSectionIds } },
      });
      await prisma.schedule.deleteMany({
        where: { courseSectionId: { in: createdSectionIds } },
      });
      await prisma.courseSection.deleteMany({
        where: { id: { in: createdSectionIds } },
      });
    }
    if (createdCourseIds.length > 0) {
      await prisma.coursePrerequisite.deleteMany({
        where: {
          OR: [
            { courseId: { in: createdCourseIds } },
            { prerequisiteCourseId: { in: createdCourseIds } },
          ],
        },
      });
      await prisma.course.deleteMany({
        where: { id: { in: createdCourseIds } },
      });
    }

    // Ensure student3 is active
    const student3User = await prisma.user.findUnique({ where: { email: 'student3@reg.edu' } });
    if (student3User) {
      await prisma.student.update({
        where: { userId: student3User.id },
        data: { status: StudentStatus.ACTIVE },
      });
    }

    await app.close();
  });

  describe('1. Concurrency & Race Condition (Seat Allocation)', () => {
    let raceSectionId: string;

    beforeAll(async () => {
      // Create a dedicated course with capacity = 1
      const raceCourse = await prisma.course.create({
        data: {
          courseCode: `RACE_${Date.now().toString().slice(-4)}`,
          courseName: 'Race Condition Test Course',
          credits: 3,
          departmentId,
        },
      });
      createdCourseIds.push(raceCourse.id);

      const section = await prisma.courseSection.create({
        data: {
          courseId: raceCourse.id,
          semesterId: activeSemesterId,
          teacherId,
          sectionNumber: 1,
          capacity: 1, // Only 1 seat available!
          room: 'Room-Race',
        },
      });
      createdSectionIds.push(section.id);
      raceSectionId = section.id;
    });

    it('should allow only 1 student to register and reject the other under concurrent requests', async () => {
      // Send both enrollment requests in parallel
      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .post('/api/v1/student/enrollments')
          .set('Authorization', `Bearer ${student1Token}`)
          .send({ courseSectionId: raceSectionId }),
        request(app.getHttpServer())
          .post('/api/v1/student/enrollments')
          .set('Authorization', `Bearer ${student2Token}`)
          .send({ courseSectionId: raceSectionId }),
      ]);

      const statuses = [res1.status, res2.status];
      // Exactly one must be 201 Created and one must be 400 Bad Request (full)
      expect(statuses).toContain(201);
      expect(statuses).toContain(400);

      // Verify the failing response message
      const failedRes = res1.status === 400 ? res1 : res2;
      expect(failedRes.body.message).toMatch(/already full/i);

      // Verify DB count: strictly 1 registered enrollment, no over-capacity
      const registeredCount = await prisma.enrollment.count({
        where: {
          courseSectionId: raceSectionId,
          status: EnrollmentStatus.REGISTERED,
        },
      });
      expect(registeredCount).toBe(1);
    });
  });

  describe('2. Student Status Verification (Non-Active Students)', () => {
    let testSectionId: string;

    beforeAll(async () => {
      const course = await prisma.course.create({
        data: {
          courseCode: `SUSP_${Date.now().toString().slice(-4)}`,
          courseName: 'Suspended Student Test Course',
          credits: 3,
          departmentId,
        },
      });
      createdCourseIds.push(course.id);

      const section = await prisma.courseSection.create({
        data: {
          courseId: course.id,
          semesterId: activeSemesterId,
          teacherId,
          sectionNumber: 1,
          capacity: 30,
          room: 'Room-Susp',
        },
      });
      createdSectionIds.push(section.id);
      testSectionId = section.id;
    });

    it('should reject enrollment if student status is SUSPENDED', async () => {
      const student3User = await prisma.user.findUnique({ where: { email: 'student3@reg.edu' } });
      // Set student3 status to SUSPENDED
      await prisma.student.update({
        where: { userId: student3User!.id },
        data: { status: StudentStatus.SUSPENDED },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${student3Token}`)
        .send({ courseSectionId: testSectionId })
        .expect(400);

      expect(res.body.message).toMatch(/Only active students are permitted to register/i);

      // Restore status to ACTIVE
      await prisma.student.update({
        where: { userId: student3User!.id },
        data: { status: StudentStatus.ACTIVE },
      });
    });
  });

  describe('3. Prerequisite Course Validation', () => {
    let baseCourseId: string;
    let baseSectionId: string;
    let advancedCourseId: string;
    let advancedSectionId: string;

    beforeAll(async () => {
      // Base Course (Prereq)
      const baseCourse = await prisma.course.create({
        data: {
          courseCode: `BASE_${Date.now().toString().slice(-4)}`,
          courseName: 'Foundations of Computing',
          credits: 3,
          departmentId,
        },
      });
      createdCourseIds.push(baseCourse.id);
      baseCourseId = baseCourse.id;

      const baseSection = await prisma.courseSection.create({
        data: {
          courseId: baseCourse.id,
          semesterId: activeSemesterId,
          teacherId,
          sectionNumber: 1,
          capacity: 30,
          room: 'Room-Base',
        },
      });
      createdSectionIds.push(baseSection.id);
      baseSectionId = baseSection.id;

      // Advanced Course
      const advCourse = await prisma.course.create({
        data: {
          courseCode: `ADV_${Date.now().toString().slice(-4)}`,
          courseName: 'Advanced Computing Systems',
          credits: 3,
          departmentId,
        },
      });
      createdCourseIds.push(advCourse.id);
      advancedCourseId = advCourse.id;

      const advSection = await prisma.courseSection.create({
        data: {
          courseId: advCourse.id,
          semesterId: activeSemesterId,
          teacherId,
          sectionNumber: 1,
          capacity: 30,
          room: 'Room-Adv',
        },
      });
      createdSectionIds.push(advSection.id);
      advancedSectionId = advSection.id;

      // Link prerequisite
      await prisma.coursePrerequisite.create({
        data: {
          courseId: advancedCourseId,
          prerequisiteCourseId: baseCourseId,
        },
      });
    });

    it('should reject enrollment when prerequisite course has not been taken', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${student3Token}`)
        .send({ courseSectionId: advancedSectionId })
        .expect(400);

      expect(res.body.message).toMatch(/Prerequisite not met/i);
    });

    it('should allow enrollment in advanced course after completing prerequisite', async () => {
      // 1. Enroll in Base course first
      await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${student3Token}`)
        .send({ courseSectionId: baseSectionId })
        .expect(201);

      // 2. Now enroll in Advanced course
      const res = await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${student3Token}`)
        .send({ courseSectionId: advancedSectionId })
        .expect(201);

      expect(res.body).toHaveProperty('enrollment');
      expect(res.body.enrollment.courseSectionId).toBe(advancedSectionId);
    });
  });

  describe('4. Maximum Credit Limit Enforcement (22 Credits)', () => {
    let heavySection1Id: string;
    let heavySection2Id: string;
    let excessSectionId: string;

    beforeAll(async () => {
      // Create high-credit courses for testing credit ceiling
      const course10a = await prisma.course.create({
        data: {
          courseCode: `CR10A_${Date.now().toString().slice(-4)}`,
          courseName: 'Core Studio A (10 Credits)',
          credits: 10,
          departmentId,
        },
      });
      createdCourseIds.push(course10a.id);

      const section10a = await prisma.courseSection.create({
        data: {
          courseId: course10a.id,
          semesterId: activeSemesterId,
          teacherId,
          sectionNumber: 1,
          capacity: 30,
          room: 'Studio A',
        },
      });
      createdSectionIds.push(section10a.id);
      heavySection1Id = section10a.id;

      const course10b = await prisma.course.create({
        data: {
          courseCode: `CR10B_${Date.now().toString().slice(-4)}`,
          courseName: 'Core Studio B (10 Credits)',
          credits: 10,
          departmentId,
        },
      });
      createdCourseIds.push(course10b.id);

      const section10b = await prisma.courseSection.create({
        data: {
          courseId: course10b.id,
          semesterId: activeSemesterId,
          teacherId,
          sectionNumber: 1,
          capacity: 30,
          room: 'Studio B',
        },
      });
      createdSectionIds.push(section10b.id);
      heavySection2Id = section10b.id;

      const courseExcess = await prisma.course.create({
        data: {
          courseCode: `CR03_${Date.now().toString().slice(-4)}`,
          courseName: 'Elective (3 Credits)',
          credits: 3,
          departmentId,
        },
      });
      createdCourseIds.push(courseExcess.id);

      const sectionExcess = await prisma.courseSection.create({
        data: {
          courseId: courseExcess.id,
          semesterId: activeSemesterId,
          teacherId,
          sectionNumber: 1,
          capacity: 30,
          room: 'Room-Elec',
        },
      });
      createdSectionIds.push(sectionExcess.id);
      excessSectionId = sectionExcess.id;
    });

    it('should reject enrollment when total registered credits would exceed 22', async () => {
      // Clean up previous student2 enrollments in this semester to have clear credit math
      const student2User = await prisma.user.findUnique({ where: { email: 'student2@reg.edu' } });
      const student2 = await prisma.student.findUnique({ where: { userId: student2User!.id } });
      await prisma.enrollment.deleteMany({
        where: {
          studentId: student2!.id,
          semesterId: activeSemesterId,
        },
      });

      // Enroll in 10 credits -> Total 10
      await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ courseSectionId: heavySection1Id })
        .expect(201);

      // Enroll in another 10 credits -> Total 20
      await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ courseSectionId: heavySection2Id })
        .expect(201);

      // Attempt to enroll in 3 credits -> Total would be 23 > 22 limit!
      const res = await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ courseSectionId: excessSectionId })
        .expect(400);

      expect(res.body.message).toMatch(/Credit limit exceeded/i);
      expect(res.body.message).toMatch(/22/);
    });
  });

  describe('5. Schedule Conflict Boundary Edge Cases', () => {
    let adjacentSection1Id: string;
    let adjacentSection2Id: string;
    let overlapSectionId: string;

    beforeAll(async () => {
      // Course 1: MONDAY 09:00 - 10:30
      const c1 = await prisma.course.create({
        data: {
          courseCode: `SCH1_${Date.now().toString().slice(-4)}`,
          courseName: 'Schedule Test 1',
          credits: 3,
          departmentId,
        },
      });
      createdCourseIds.push(c1.id);
      const s1 = await prisma.courseSection.create({
        data: {
          courseId: c1.id,
          semesterId: activeSemesterId,
          teacherId,
          sectionNumber: 1,
          capacity: 30,
          room: 'Room-101',
        },
      });
      createdSectionIds.push(s1.id);
      adjacentSection1Id = s1.id;
      await prisma.schedule.create({
        data: {
          courseSectionId: s1.id,
          dayOfWeek: DayOfWeek.FRIDAY,
          startTime: '09:00',
          endTime: '10:30',
          room: 'Room-101',
        },
      });

      // Course 2 (Adjacent boundary): MONDAY 10:30 - 12:00 (Starts exactly when Course 1 ends)
      const c2 = await prisma.course.create({
        data: {
          courseCode: `SCH2_${Date.now().toString().slice(-4)}`,
          courseName: 'Schedule Test 2 (Adjacent)',
          credits: 3,
          departmentId,
        },
      });
      createdCourseIds.push(c2.id);
      const s2 = await prisma.courseSection.create({
        data: {
          courseId: c2.id,
          semesterId: activeSemesterId,
          teacherId,
          sectionNumber: 1,
          capacity: 30,
          room: 'Room-102',
        },
      });
      createdSectionIds.push(s2.id);
      adjacentSection2Id = s2.id;
      await prisma.schedule.create({
        data: {
          courseSectionId: s2.id,
          dayOfWeek: DayOfWeek.FRIDAY,
          startTime: '10:30',
          endTime: '12:00',
          room: 'Room-102',
        },
      });

      // Course 3 (True Overlap): MONDAY 10:00 - 11:30 (Overlaps both C1 and C2)
      const c3 = await prisma.course.create({
        data: {
          courseCode: `SCH3_${Date.now().toString().slice(-4)}`,
          courseName: 'Schedule Test 3 (Overlap)',
          credits: 3,
          departmentId,
        },
      });
      createdCourseIds.push(c3.id);
      const s3 = await prisma.courseSection.create({
        data: {
          courseId: c3.id,
          semesterId: activeSemesterId,
          teacherId,
          sectionNumber: 1,
          capacity: 30,
          room: 'Room-103',
        },
      });
      createdSectionIds.push(s3.id);
      overlapSectionId = s3.id;
      await prisma.schedule.create({
        data: {
          courseSectionId: s3.id,
          dayOfWeek: DayOfWeek.FRIDAY,
          startTime: '10:00',
          endTime: '11:30',
          room: 'Room-103',
        },
      });
    });

    it('should permit adjacent back-to-back schedules with touching boundary times', async () => {
      // Student 1 enrolls in Schedule 1 (09:00 - 10:30)
      await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ courseSectionId: adjacentSection1Id })
        .expect(201);

      // Student 1 enrolls in Schedule 2 (10:30 - 12:00) -> Exact boundary, NO conflict
      const res = await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ courseSectionId: adjacentSection2Id })
        .expect(201);

      expect(res.body).toHaveProperty('enrollment');
      expect(res.body.enrollment.courseSectionId).toBe(adjacentSection2Id);
    });

    it('should reject overlapping schedules on the same day', async () => {
      // Student 1 attempts to enroll in Schedule 3 (10:00 - 11:30) -> Conflicts with 09:00-10:30 and 10:30-12:00
      const res = await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ courseSectionId: overlapSectionId })
        .expect(400);

      expect(res.body.message).toMatch(/Schedule conflict/i);
    });
  });
});
