# PHASE 3 REPORT

## Objective
สร้าง Database Schema ครอบคลุม 10 Entities ตามแผนที่ออกแบบไว้ใน `DATABASE_PLAN.md`, สร้างและรัน Prisma Migration บน Neon Cloud PostgreSQL, จัดทำ Seed Data ข้อมูลเริ่มต้นของระบบ (Admin, อาจารย์, นักศึกษา, ภาควิชา, รายวิชา, ภาคการศึกษา, กลุ่มเรียน, ตารางเรียน, การลงทะเบียน, Audit Log), สร้าง PrismaService สำหรับ NestJS, และรัน Database Integration Tests ตรวจสอบความถูกต้องของข้อมูลและความสัมพันธ์

---

## Completed

### 1. Tables Created (ตารางที่สร้างขึ้นใน PostgreSQL)
สร้างทั้งหมด 10 ตาราง (+ 1 ตาราง migration metadata):
1. `users`: บัญชีผู้ใช้, รหัสผ่านแฮช (bcrypt), บทบาท (`STUDENT`, `TEACHER`, `ADMIN`)
2. `departments`: สาขาวิชา/ภาควิชา (`code`, `name`)
3. `students`: โปรไฟล์นักศึกษา (`student_code`, `year_level`, `status`, เชื่อมโยงกับ `users` และ `departments`)
4. `teachers`: โปรไฟล์อาจารย์ (`teacher_code`, เชื่อมโยงกับ `users` และ `departments`)
5. `courses`: ข้อมูลรายวิชา (`course_code`, `course_name`, `credits`, `description`)
6. `semesters`: ภาคการศึกษา (`academic_year`, `semester_number`, `registration_start`, `registration_end`, `status`)
7. `course_sections`: กลุ่มเรียนในแต่ละเทอม (`section_number`, `capacity`, `room`, อาจารย์ผู้สอน)
8. `schedules`: ตารางเรียนประจำสัปดาห์ (`day_of_week`, `start_time`, `end_time`, `room`)
9. `enrollments`: การลงทะเบียนเรียนของนักศึกษา (`status`, `registered_at`)
10. `audit_logs`: บันทึกประวัติกิจกรรมสำคัญในระบบ (`action`, `entity`, `details`, `ip_address`)

### 2. Relations & Foreign Keys
- `User` 1:1 `Student` (Cascade on delete user)
- `User` 1:1 `Teacher` (Cascade on delete user)
- `User` 1:N `AuditLog` (SetNull on delete user)
- `Department` 1:N `Student`, `Teacher`, `Course` (Restrict)
- `Course` 1:N `CourseSection` (Restrict)
- `Semester` 1:N `CourseSection`, `Enrollment` (Restrict)
- `Teacher` 1:N `CourseSection` (Restrict)
- `CourseSection` 1:N `Schedule` (Cascade on delete section)
- `CourseSection` 1:N `Enrollment` (Restrict)
- `Student` 1:N `Enrollment` (Restrict)

### 3. Constraints & Indexes
- **Unique Constraints**:
  - `users.email`
  - `students.student_code`, `students.user_id`
  - `teachers.teacher_code`, `teachers.user_id`
  - `departments.code`
  - `courses.course_code`
  - `semesters(academic_year, semester_number)`
  - `course_sections(course_id, semester_id, section_number)`
  - `enrollments(student_id, course_section_id)`
- **Indexes**:
  - `idx_users_email`, `idx_students_department`, `idx_courses_department`, `idx_course_sections_semester`, `idx_schedules_day_time`, `idx_enrollments_student`, `idx_audit_logs_action`, etc.

### 4. Migration
- สร้าง Migration: `prisma/migrations/20261001181448_init/migration.sql`
- สถานะ: Applied สำเร็จไปยัง Neon Cloud PostgreSQL 18.6 โดยตรง

### 5. Seed Data Summary
- บันทึกรหัสผ่านผ่าน bcrypt hashing (10 rounds)
- ผู้ใช้งาน:
  - **Admin**: `admin@reg.edu` (Password: `Admin@1234`)
  - **Teachers**: `teacher1@reg.edu` (Dr. Alan Turing - CS), `teacher2@reg.edu` (Dr. Grace Hopper - SE) (Password: `Password@123`)
  - **Students**: `student1@reg.edu` (John Doe - 6601001), `student2@reg.edu` (Jane Smith - 6601002), `student3@reg.edu` (Bob Johnson - 6501001) (Password: `Password@123`)
- ภาควิชา: CS, SE
- รายวิชา: CS101, CS102, CS201, SE201, SE301
- ภาคการศึกษา: 2026/1 (สถานะ `OPEN`, ช่วงลงทะเบียนเปิดอยู่)
- Sections & Schedules: 4 กลุ่มเรียนพร้อมตารางเรียนในวันจันทร์-พฤหัสบดี
- ตัวอย่างการลงทะเบียน: 1 รายการ (John Doe ลงทะเบียน CS101 Section 1)
- Audit Log เริ่มต้น: 1 รายการ (`DATABASE_INITIAL_SEED`)

### 6. NestJS Database Integration
- สร้าง `PrismaService` และ `PrismaModule` แบบ Global Provider รองรับการฉีด Dependency ไปยังโมดูลอื่นๆ ใน NestJS

---

## Files Created
- `backend/prisma/migrations/20261001181448_init/migration.sql`
- `backend/prisma/seed.ts`
- `backend/src/database/prisma.service.ts`
- `backend/src/database/prisma.module.ts`
- `PHASE_3_REPORT.md`

## Files Modified
- `backend/prisma/schema.prisma` (นิยาม 10 Models, 5 Enums, Indexes, Constraints)
- `backend/prisma7.config.ts` (รองรับ DIRECT_URL สำหรับ migration connection)
- `backend/package.json` (เพิ่ม prisma seed script และ dependencies)
- `backend/.env` (เพิ่ม DIRECT_URL)
- `backend/src/app.module.ts` (นำเข้า PrismaModule)

## Database Changes
- สร้างตาราง 10 ตารางบน Neon PostgreSQL (`users`, `departments`, `students`, `teachers`, `courses`, `semesters`, `course_sections`, `schedules`, `enrollments`, `audit_logs`)
- สร้าง Indexes และ Foreign Key Constraints ทั้งหมด
- เติมข้อมูล Seed Data ตัวอย่างครบถ้วน

## API Changes
- ยังไม่มี (เตรียมสร้างใน Phase 4)

## Tests
- Database Query & Relationship Test:
  1. ทดสอบ Query Users และแยกประเภทสิทธิ์ (`admin`, `teacher`, `student`)
  2. ทดสอบความสัมพันธ์ Department -> Courses
  3. ทดสอบ Active Semester และ Sections พร้อม Schedules
  4. ทดสอบ Student Enrollment Lookup และ Join ข้อมูลรายวิชา
  5. ทดสอบ AuditLog Count
- NestJS Unit Test (`app.controller.spec.ts`)
- NestJS Build Compilation (`nest build`)

## Test Results
- PASS (Database Query Tests: Passed 5/5, NestJS Unit Tests: 1/1 Passed, NestJS Build: OK)

## Errors
1. Prisma 7 ไม่อนุญาตให้ใส่ `url = env("DATABASE_URL")` ในบล็อก `datasource db` ของ `schema.prisma`
2. PgBouncer pooler connection ใน Neon ไม่อนุญาต session-level advisory lock ขณะรัน `prisma migrate dev`
3. Prisma 7 PrismaClient constructor ไม่รับพารามิเตอร์ `datasources` แบบเดิม

## Fixes
1. ย้ายการคอนฟิก database connection ไปจัดการที่ `prisma7.config.ts`
2. กำหนด `DIRECT_URL` (direct endpoint ไม่ผ่าน pooler) สำหรับคำสั่ง Migration
3. ติดตั้งและใช้งาน `@prisma/adapter-pg` ร่วมกับ `pg.Pool` สำหรับเชื่อมต่อ PrismaClient

## Known Issues
- ไม่มี

## Next Phase
- **PHASE 4 — Authentication**: สร้าง Auth Module ใน NestJS (Login endpoint, bcrypt password validation, JWT Access Token, Refresh Token, Role-Based Access Control Guards สำหรับ `STUDENT`, `TEACHER`, `ADMIN`)

---

## Approval Required

STOP

Waiting for user approval.
