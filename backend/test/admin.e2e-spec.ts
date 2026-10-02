import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Admin Module (e2e)', () => {
  jest.setTimeout(35000);
  let app: INestApplication;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let testDepartmentId: string;
  let testCourseId: string;
  let createdUserId: string;

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

    // Login as Admin
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@reg.edu',
        password: 'Admin@1234',
      });
    adminToken = adminRes.body.accessToken;

    // Login as Teacher
    const teacherRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'teacher1@reg.edu',
        password: 'Password@123',
      });
    teacherToken = teacherRes.body.accessToken;

    // Login as Student
    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'student1@reg.edu',
        password: 'Password@123',
      });
    studentToken = studentRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/admin/dashboard', () => {
    it('should return dashboard overview and stats for Admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('overview');
      expect(res.body.overview).toHaveProperty('totalUsers');
      expect(res.body.overview).toHaveProperty('totalStudents');
      expect(res.body.overview).toHaveProperty('totalTeachers');
      expect(res.body.overview).toHaveProperty('totalCourses');
      expect(res.body).toHaveProperty('recentLogs');
    });

    it('should reject unauthenticated requests with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .expect(401);
    });

    it('should reject Teacher role with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('should reject Student role with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('User Management', () => {
    it('should list all users', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should create a new admin user', async () => {
      const randomSuffix = Math.floor(Math.random() * 10000);
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `testadmin${randomSuffix}@reg.edu`,
          password: 'Password@123',
          role: 'ADMIN',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(`testadmin${randomSuffix}@reg.edu`);
      createdUserId = res.body.id;
    });

    it('should update user email, phone, and password via PATCH', async () => {
      expect(createdUserId).toBeDefined();
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phone: '0812345678',
          password: 'NewPassword@999',
        })
        .expect(200);

      expect(res.body.phone).toBe('0812345678');
    });

    it('should delete the newly created user', async () => {
      expect(createdUserId).toBeDefined();
      await request(app.getHttpServer())
        .delete(`/api/v1/admin/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Departments & Courses Management', () => {
    it('should get departments list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      testDepartmentId = res.body[0].id;
    });

    it('should get courses list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should create a new course', async () => {
      const randomSuffix = Math.floor(Math.random() * 900) + 100;
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseCode: `CS${randomSuffix}`,
          courseName: 'Advanced Distributed Systems',
          credits: 3,
          departmentId: testDepartmentId,
          description: 'High throughput distributed systems and microservices',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      testCourseId = res.body.id;
    });

    it('should delete the created course', async () => {
      expect(testCourseId).toBeDefined();
      await request(app.getHttpServer())
        .delete(`/api/v1/admin/courses/${testCourseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Semesters, Sections, and Audit Logs', () => {
    it('should get semesters list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/semesters')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should get sections list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get audit logs list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const log = res.body[0];
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('entity');
    });
  });
});
