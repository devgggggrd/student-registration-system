import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Student Module (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let studentToken: string;
  let teacherToken: string;
  let availableSectionId: string;
  let enrolledSectionId: string;
  let enrolledId: string;

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

    // Login as Student (Jane Smith: student2@reg.edu)
    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'student2@reg.edu',
        password: 'Password@123',
      });
    studentToken = studentRes.body.accessToken;

    // Login as Teacher
    const teacherRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'teacher1@reg.edu',
        password: 'Password@123',
      });
    teacherToken = teacherRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/student/profile', () => {
    it('should return student profile and active semester stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('student');
      expect(res.body.student.studentCode).toBe('6601002');
      expect(res.body.student.firstName).toBe('Jane');
      expect(res.body).toHaveProperty('currentSemester');
      expect(res.body).toHaveProperty('stats');
    });

    it('should deny access without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/student/profile')
        .expect(401);
    });

    it('should deny access to non-student role', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/student/courses', () => {
    it('should return available courses with sections and schedules', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/student/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('courses');
      expect(Array.isArray(res.body.courses)).toBe(true);
      expect(res.body.courses.length).toBeGreaterThan(0);

      const firstCourse = res.body.courses[0];
      expect(firstCourse).toHaveProperty('courseCode');
      expect(firstCourse).toHaveProperty('sections');
      expect(firstCourse.sections[0]).toHaveProperty('capacity');
      expect(firstCourse.sections[0]).toHaveProperty('schedules');

      // Pick CS201 or available section for testing enrollment
      const cs201 = res.body.courses.find((c: any) => c.courseCode === 'CS201');
      if (cs201 && cs201.sections.length > 0) {
        availableSectionId = cs201.sections[0].id;
      }
    });

    it('should filter courses by search keyword', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/student/courses?search=Programming')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.courses.length).toBeGreaterThan(0);
      expect(res.body.courses.some((c: any) => c.courseCode === 'CS101')).toBe(true);
    });
  });

  describe('POST /api/v1/student/enrollments & Registration Rules', () => {
    it('should successfully register student for an available course section', async () => {
      if (!availableSectionId) {
        const coursesRes = await request(app.getHttpServer())
          .get('/api/v1/student/courses')
          .set('Authorization', `Bearer ${studentToken}`);
        availableSectionId = coursesRes.body.courses[0].sections[0].id;
      }

      const res = await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseSectionId: availableSectionId })
        .expect(201);

      expect(res.body).toHaveProperty('enrollment');
      expect(res.body.enrollment.status).toBe('REGISTERED');
      enrolledId = res.body.enrollment.id;
      enrolledSectionId = availableSectionId;
    });

    it('should REJECT duplicate course registration in same semester', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseSectionId: enrolledSectionId })
        .expect(409);

      expect(res.body.message).toContain('already registered');
    });

    it('should validate invalid UUID format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/student/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseSectionId: 'invalid-id' })
        .expect(400);
    });
  });

  describe('GET /api/v1/student/schedule', () => {
    it('should return weekly timetable with enrolled slots', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/student/schedule')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('slots');
      expect(Array.isArray(res.body.slots)).toBe(true);
      expect(res.body.slots.length).toBeGreaterThan(0);
      expect(res.body.slots[0]).toHaveProperty('dayOfWeek');
      expect(res.body.slots[0]).toHaveProperty('startTime');
      expect(res.body.slots[0]).toHaveProperty('endTime');
      expect(res.body.slots[0]).toHaveProperty('room');
    });
  });

  describe('DELETE /api/v1/student/enrollments/:id', () => {
    it('should successfully drop the enrolled course', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/student/enrollments/${enrolledId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.enrollment.status).toBe('DROPPED');
    });

    it('should reject dropping a course that is already dropped', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/student/enrollments/${enrolledId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });
  });
});
