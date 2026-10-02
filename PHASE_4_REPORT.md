# PHASE 4 REPORT

## Objective
พัฒนาระบบยืนยันตัวตนและการควบคุมสิทธิ์ (Authentication & Role-Based Access Control - RBAC) ฝั่ง Backend ด้วย NestJS ประกอบด้วย:
1. การตรวจสอบบัญชีผู้ใช้และรหัสผ่านด้วย bcrypt
2. การสร้างและตรวจสอบ JWT Access Token (1 วัน) และ Refresh Token (7 วัน)
3. การจำกัดสิทธิ์การเข้าถึง API ตามบทบาท (`STUDENT`, `TEACHER`, `ADMIN`) ด้วย NestJS Guards และ Decorators
4. Endpoint การขอต่ออายุ Token (`/auth/refresh`) และดูโปรไฟล์ตนเอง (`/auth/me`)
5. การบันทึก Audit Log การเข้าสู่ระบบ
6. การเขียนและรัน Automated E2E Tests ครอบคลุมการทำงานของ Auth และ RBAC ทั้งหมด

---

## Completed

### 1. DTOs & Validation
- `LoginDto`: ตรวจสอบรูปแบบอีเมล (`@IsEmail`) และความยาวรหัสผ่าน (`@MinLength(6)`)
- `RefreshTokenDto`: ตรวจสอบความถูกต้องของ Refresh Token string

### 2. JWT Strategy & Guards
- `JwtStrategy`: ดึงและถอดรหัส Bearer JWT Token, ค้นหาข้อมูลผู้ใช้ในฐานข้อมูลพร้อม Join ตาราง `Student` หรือ `Teacher` ตาม Role
- `JwtAuthGuard`: ป้องกัน Endpoint สำหรับผู้ใช้ที่ไม่มี Token หรือ Token หมดอายุ (คืนค่า 401 Unauthorized)
- `RolesGuard`: สกัด Role จาก `@Roles(...)` metadata ผ่าน `Reflector` และเทียบกับ `user.role` (คืนค่า 403 Forbidden หากสิทธิ์ไม่ถูกต้อง)

### 3. Custom Decorators
- `@Roles(...roles: Role[])`: ประกาศสิทธิ์ที่ต้องการสำหรับ Controller หรือ Method
- `@CurrentUser()`: ดึงข้อมูลผู้ใช้ปัจจุบันหรือฟิลด์ที่ต้องการจาก Request
- `@Public()`: ยกเว้นการตรวจ Guard สำหรับ Endpoint สาธารณะ

### 4. Authentication Services & Controllers
- `POST /api/v1/auth/login`: ตรวจสอบรหัสผ่าน, ออก Access & Refresh Tokens, บันทึกประวัติ `LOGIN` ลงใน `audit_logs`
- `POST /api/v1/auth/refresh`: รับ Refresh Token เพื่อออกคู่ Token ใหม่
- `GET /api/v1/auth/me`: ส่งคืนโปรไฟล์ผู้ใช้ปัจจุบันและข้อมูลนักศึกษา/อาจารย์
- Endpoints ทดสอบ RBAC:
  - `GET /api/v1/auth/test-admin` (เฉพาะ ADMIN)
  - `GET /api/v1/auth/test-teacher` (เฉพาะ TEACHER)
  - `GET /api/v1/auth/test-student` (เฉพาะ STUDENT)

### 5. Application Configuration
- ตั้งค่า Global Prefix เป็น `/api/v1`
- เปิดใช้งาน Global `ValidationPipe` (`whitelist: true`, `transform: true`)
- เปิดใช้งาน CORS สำหรับ Frontend (`http://localhost:5173`)

---

## Files Created
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/auth/dto/refresh-token.dto.ts`
- `backend/src/auth/guards/jwt-auth.guard.ts`
- `backend/src/auth/guards/roles.guard.ts`
- `backend/src/auth/strategies/jwt.strategy.ts`
- `backend/src/auth/decorators/roles.decorator.ts`
- `backend/src/auth/decorators/current-user.decorator.ts`
- `backend/test/auth.e2e-spec.ts`
- `PHASE_4_REPORT.md`

## Files Modified
- `backend/src/app.module.ts` (นำเข้า `ConfigModule` และ `AuthModule`)
- `backend/src/main.ts` (ตั้งค่า GlobalPrefix, ValidationPipe, และ CORS)

## Database Changes
- มีการบันทึก Audit Log เพิ่มขึ้นเมื่อมีผู้ใช้ Login เข้าสู่ระบบ (`action: LOGIN`)

## API Changes
- เพิ่ม Endpoints กลุ่ม Auth:
  - `POST /api/v1/auth/login` (Public)
  - `POST /api/v1/auth/refresh` (Public)
  - `GET /api/v1/auth/me` (Authenticated)
  - `GET /api/v1/auth/test-admin` (Role: ADMIN)
  - `GET /api/v1/auth/test-teacher` (Role: TEACHER)
  - `GET /api/v1/auth/test-student` (Role: STUDENT)

## Tests
- **E2E Tests (`test/auth.e2e-spec.ts`)**:
  1. `POST /auth/login` as ADMIN -> 200 OK & returns Tokens
  2. `POST /auth/login` as TEACHER -> 200 OK & returns Teacher profile
  3. `POST /auth/login` as STUDENT -> 200 OK & returns Student profile
  4. `POST /auth/login` with invalid password -> 401 Unauthorized
  5. `POST /auth/login` with non-existent email -> 401 Unauthorized
  6. `POST /auth/login` with malformed payload -> 400 Bad Request
  7. `POST /auth/refresh` with valid refresh token -> 200 OK & issues new tokens
  8. `POST /auth/refresh` with invalid refresh token -> 401 Unauthorized
  9. `GET /auth/me` with Bearer token -> 200 OK & returns current profile
  10. `GET /auth/me` without Bearer token -> 401 Unauthorized
  11. RBAC: ADMIN can access `/auth/test-admin` -> 200 OK
  12. RBAC: STUDENT cannot access `/auth/test-admin` -> 403 Forbidden
  13. RBAC: TEACHER can access `/auth/test-teacher` -> 200 OK
  14. RBAC: STUDENT cannot access `/auth/test-teacher` -> 403 Forbidden
  15. RBAC: STUDENT can access `/auth/test-student` -> 200 OK
  16. RBAC: ADMIN cannot access `/auth/test-student` -> 403 Forbidden
- **Unit Tests**: `npm run test` (AppController unit test)
- **Compilation Build**: `npm run build` (NestJS build)

## Test Results
- PASS (E2E Tests: 16/16 Passed, Unit Tests: 1/1 Passed, Build: OK)

## Errors
- การรัน E2E test ครั้งแรกกับ Cloud Postgres แบบ Serverless ใช้เวลาเกิน Jest default timeout 5000ms เนื่องจาก cold start latency ของ compute endpoint

## Fixes
- เพิ่ม `jest.setTimeout(30000)` ใน `test/auth.e2e-spec.ts` เพื่อรองรับ cold start latency

## Known Issues
- ไม่มี

## Next Phase
- **PHASE 5 — Student Module**:
  - Backend: สร้าง Student Profile, Course Search API, Enrollment API, และ Student Schedule API
  - Frontend: สร้าง Student Dashboard, Course Search Page, Registration Page, My Courses, และ Schedule Timetable Component

---

## Approval Required

STOP

Waiting for user approval.
