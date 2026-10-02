import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth & RBAC System (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let studentRefreshToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully log in as ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@reg.edu',
          password: 'Admin@1234',
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.role).toBe('ADMIN');
      adminToken = res.body.accessToken;
    });

    it('should successfully log in as TEACHER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'teacher1@reg.edu',
          password: 'Password@123',
        })
        .expect(200);

      expect(res.body.user.role).toBe('TEACHER');
      expect(res.body.user.teacher).toBeDefined();
      expect(res.body.user.teacher.teacherCode).toBe('T001');
      teacherToken = res.body.accessToken;
    });

    it('should successfully log in as STUDENT', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'student1@reg.edu',
          password: 'Password@123',
        })
        .expect(200);

      expect(res.body.user.role).toBe('STUDENT');
      expect(res.body.user.student).toBeDefined();
      expect(res.body.user.student.studentCode).toBe('6601001');
      studentToken = res.body.accessToken;
      studentRefreshToken = res.body.refreshToken;
    });

    it('should reject invalid password with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@reg.edu',
          password: 'WrongPassword',
        })
        .expect(401);
    });

    it('should reject non-existent user with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nobody@reg.edu',
          password: 'Password@123',
        })
        .expect(401);
    });

    it('should reject malformed body with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should issue new tokens with valid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: studentRefreshToken,
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid.jwt.token',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile with valid JWT', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.email).toBe('student1@reg.edu');
      expect(res.body.role).toBe('STUDENT');
      expect(res.body.student.firstName).toBe('John');
    });

    it('should reject request without token with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('ADMIN should access admin endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/test-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('STUDENT should be FORBIDDEN from admin endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/test-admin')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('TEACHER should access teacher endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/test-teacher')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
    });

    it('STUDENT should be FORBIDDEN from teacher endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/test-teacher')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('STUDENT should access student endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/test-student')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
    });

    it('ADMIN should be FORBIDDEN from student endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/test-student')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });
});
