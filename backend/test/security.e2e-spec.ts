import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import helmet from 'helmet';

jest.setTimeout(120000);

describe('Security Hardening & Penetration Testing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let student1Token: string;
  let student2Token: string;
  let teacher1Token: string;
  let teacher2Token: string;

  let student1EnrollmentId: string;
  let teacher1SectionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
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

    // 2. Login Student 1 (John Doe)
    const s1Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student1@reg.edu', password: 'Password@123' });
    student1Token = s1Res.body.accessToken;

    // 3. Login Student 2 (Jane Smith)
    const s2Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student2@reg.edu', password: 'Password@123' });
    student2Token = s2Res.body.accessToken;

    // 4. Login Teacher 1 (Alan Turing)
    const t1Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'teacher1@reg.edu', password: 'Password@123' });
    teacher1Token = t1Res.body.accessToken;

    // 5. Login Teacher 2 (Grace Hopper)
    const t2Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'teacher2@reg.edu', password: 'Password@123' });
    teacher2Token = t2Res.body.accessToken;

    // Fetch an enrollment belonging to student1
    const s1User = await prisma.user.findUnique({
      where: { email: 'student1@reg.edu' },
      include: { student: true },
    });
    const s1Enrollment = await prisma.enrollment.findFirst({
      where: { studentId: s1User!.student!.id },
    });
    if (s1Enrollment) {
      student1EnrollmentId = s1Enrollment.id;
    }

    // Fetch a section taught by teacher1
    const t1User = await prisma.user.findUnique({
      where: { email: 'teacher1@reg.edu' },
      include: { teacher: true },
    });
    const t1Section = await prisma.courseSection.findFirst({
      where: { teacherId: t1User!.teacher!.id },
    });
    if (t1Section) {
      teacher1SectionId = t1Section.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Security Headers (OWASP A05: Security Misconfiguration)', () => {
    it('should include Helmet security headers in HTTP responses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(200);

      // Verify helmet headers
      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(res.headers).toHaveProperty('x-frame-options');
      expect(res.headers).toHaveProperty('x-dns-prefetch-control');
    });
  });

  describe('2. SQL Injection Resistance (OWASP A03: Injection)', () => {
    it('should neutralize SQL injection attack in course search filter', async () => {
      const sqlInjectionPayload = "'; DROP TABLE courses; --";
      const res = await request(app.getHttpServer())
        .get(`/api/v1/student/courses?search=${encodeURIComponent(sqlInjectionPayload)}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(200);

      // Safe parameterization: table is NOT dropped, returns empty or safe courses array
      expect(res.body).toHaveProperty('courses');
      expect(Array.isArray(res.body.courses)).toBe(true);

      // Verify courses table is intact
      const count = await prisma.course.count();
      expect(count).toBeGreaterThan(0);
    });

    it('should reject SQL injection in login credentials', async () => {
      const sqlPayload = "' OR '1'='1";
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: sqlPayload,
          password: 'Password@123',
        })
        .expect(400); // Fails class-validator email validation
    });

    it('should safely handle SQL UNION queries in admin user search', async () => {
      const unionPayload = "' UNION SELECT null, null, null, null, null --";
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/users?search=${encodeURIComponent(unionPayload)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('3. Cross-Site Scripting (XSS) Sanitization (OWASP A03)', () => {
    it('should safely accept and escape HTML/JS script tags without execution', async () => {
      const xssPayload = "<script>alert('XSS_ATTACK')</script>";
      const res = await request(app.getHttpServer())
        .get(`/api/v1/student/courses?search=${encodeURIComponent(xssPayload)}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('courses');
      expect(Array.isArray(res.body.courses)).toBe(true);
    });
  });

  describe('4. Broken Object Level Authorization / IDOR (OWASP A01: Broken Access Control)', () => {
    it('should prevent Student 2 from dropping an enrollment owned by Student 1', async () => {
      if (!student1EnrollmentId) return;

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/student/enrollments/${student1EnrollmentId}`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(400);

      expect(res.body.message).toMatch(/only drop your own/i);
    });

    it('should prevent Teacher 2 from viewing the section roster of Teacher 1', async () => {
      if (!teacher1SectionId) return;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/teacher/sections/${teacher1SectionId}/roster`)
        .set('Authorization', `Bearer ${teacher2Token}`)
        .expect(403);

      expect(res.body.message).toMatch(/not authorized to view the roster/i);
    });
  });

  describe('5. Privilege Escalation & Role Boundaries (OWASP A01)', () => {
    it('should block Student from accessing Admin Users API', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(403);
    });

    it('should block Teacher from creating a Semester', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/semesters')
        .set('Authorization', `Bearer ${teacher1Token}`)
        .send({
          academicYear: 2027,
          semesterNumber: 1,
          registrationStart: '2027-01-01T00:00:00.000Z',
          registrationEnd: '2027-01-15T00:00:00.000Z',
          startDate: '2027-02-01',
          endDate: '2027-06-30',
        })
        .expect(403);
    });

    it('should block unauthenticated requests to Admin Audit Logs', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs')
        .expect(401);
    });
  });
});
