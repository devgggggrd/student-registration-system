import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Teacher Module (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let teacher1Token: string;
  let teacher2Token: string;
  let studentToken: string;
  let teacher1SectionId: string;
  let teacher2SectionId: string;

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

    // Login as Teacher 1 (Alan Turing: teacher1@reg.edu)
    const t1Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'teacher1@reg.edu',
        password: 'Password@123',
      });
    teacher1Token = t1Res.body.accessToken;

    // Login as Teacher 2 (Ada Lovelace: teacher2@reg.edu)
    const t2Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'teacher2@reg.edu',
        password: 'Password@123',
      });
    teacher2Token = t2Res.body.accessToken;

    // Login as Student (student1@reg.edu)
    const sRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'student1@reg.edu',
        password: 'Password@123',
      });
    studentToken = sRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/teacher/profile', () => {
    it('should return teacher profile and stats for authenticated teacher', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/teacher/profile')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('teacher');
      expect(res.body.teacher.teacherCode).toBe('T001');
      expect(res.body.teacher.firstName).toBe('Alan');
      expect(res.body.teacher.lastName).toBe('Turing');
      expect(res.body).toHaveProperty('currentSemester');
      expect(res.body).toHaveProperty('stats');
      expect(res.body.stats).toHaveProperty('sectionsCount');
      expect(res.body.stats).toHaveProperty('studentsCount');
      expect(res.body.stats).toHaveProperty('totalCredits');
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/teacher/profile')
        .expect(401);
    });

    it('should reject student role with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/teacher/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/teacher/sections', () => {
    it('should return sections taught by Teacher 1', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/teacher/sections')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const section = res.body[0];
      expect(section).toHaveProperty('id');
      expect(section).toHaveProperty('sectionNumber');
      expect(section).toHaveProperty('capacity');
      expect(section).toHaveProperty('enrolledCount');
      expect(section).toHaveProperty('remainingSeats');
      expect(section).toHaveProperty('course');
      expect(section).toHaveProperty('schedules');
      teacher1SectionId = section.id;
    });

    it('should return sections taught by Teacher 2', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/teacher/sections')
        .set('Authorization', `Bearer ${teacher2Token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        teacher2SectionId = res.body[0].id;
      }
    });
  });

  describe('GET /api/v1/teacher/sections/:id/roster', () => {
    it('should return student roster for own section', async () => {
      expect(teacher1SectionId).toBeDefined();

      const res = await request(app.getHttpServer())
        .get(`/api/v1/teacher/sections/${teacher1SectionId}/roster`)
        .set('Authorization', `Bearer ${teacher1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('section');
      expect(res.body.section.id).toBe(teacher1SectionId);
      expect(res.body).toHaveProperty('students');
      expect(Array.isArray(res.body.students)).toBe(true);
      expect(res.body).toHaveProperty('stats');
      expect(res.body.stats).toHaveProperty('totalActive');
    });

    it('should deny access (403 Forbidden) when accessing another teacher section', async () => {
      if (teacher2SectionId) {
        await request(app.getHttpServer())
          .get(`/api/v1/teacher/sections/${teacher2SectionId}/roster`)
          .set('Authorization', `Bearer ${teacher1Token}`)
          .expect(403);
      }
    });

    it('should return 404 for non-existent section id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/teacher/sections/00000000-0000-0000-0000-000000000000/roster')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/teacher/schedule', () => {
    it('should return weekly teaching schedule slots', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/teacher/schedule')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('semester');
      expect(res.body).toHaveProperty('slots');
      expect(Array.isArray(res.body.slots)).toBe(true);

      if (res.body.slots.length > 0) {
        const slot = res.body.slots[0];
        expect(slot).toHaveProperty('courseCode');
        expect(slot).toHaveProperty('sectionNumber');
        expect(slot).toHaveProperty('dayOfWeek');
        expect(slot).toHaveProperty('startTime');
        expect(slot).toHaveProperty('endTime');
        expect(slot).toHaveProperty('room');
      }
    });
  });
});
