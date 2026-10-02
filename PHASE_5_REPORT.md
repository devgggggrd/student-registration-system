# PHASE 5 REPORT

## Objective
พัฒนาโมดูลนักศึกษา (Student Module) แบบครบวงจรทั้งฝั่ง Backend (NestJS) และ Frontend (React + Vite + Tailwind CSS) รองรับการดูข้อมูลโปรไฟล์, ค้นหาและดูรายละเอียดรายวิชา, ลงทะเบียนเรียนแบบ Atomic Transaction พร้อมตรวจสอบเงื่อนไขความขัดแย้ง, ถอนรายวิชา, และการแสดงตารางเรียนประจำสัปดาห์แบบโต้ตอบ

---

## Completed

### 1. Backend Implementation (`backend/src/students/`)
- **Student Profile API (`GET /api/v1/student/profile`)**:
  - ส่งข้อมูลโปรไฟล์นักศึกษา (รหัส, ชื่อ-สกุล, สาขา, ชั้นปี, สถานะ)
  - คำนวณสรุปหน่วยกิตที่ลงทะเบียนในเทอมปัจจุบัน และจำนวนวิชาที่ลงทะเบียน
  - ส่งข้อมูลภาคการศึกษาปัจจุบันและช่วงเวลาเปิดรับลงทะเบียน
- **Course Catalog Search API (`GET /api/v1/student/courses`)**:
  - ค้นหารายวิชาที่เปิดสอนในเทอมปัจจุบันตามชื่อวิชา หรือรหัสวิชา
  - กรองรายวิชาตามภาควิชา (Department filter)
  - คำนวณที่นั่งว่าง (`remainingSeats`), เช็กสถานะเต็ม (`isFull`), และตรวจสอบว่านักศึกษาเคยลงทะเบียนวิชานี้แล้วหรือไม่ (`isAlreadyEnrolled`)
- **Enrollment Engine API (`POST /api/v1/student/enrollments`)**:
  - ตรวจสอบสถานะภาคการศึกษาต้องเป็น `OPEN` และอยู่ในช่วงวันเวลาลงทะเบียน
  - ตรวจสอบความจุห้องเรียน (Capacity check)
  - ตรวจสอบการลงทะเบียนซ้ำ (Duplicate enrollment prevention ในวิชาเดียวกัน)
  - ตรวจจับตารางเรียนชนกัน (Schedule conflict detection ข้ามวันและเวลาเรียน)
  - ทำงานภายใต้ Database Transaction พร้อมรองรับการ Re-activate รายการที่เคย Drop ไปแล้ว
  - บันทึก Audit Log เหตุการณ์ `REGISTER_COURSE`
- **Course Withdrawal / Drop API (`DELETE /api/v1/student/enrollments/:id`)**:
  - ตรวจสอบสิทธิ์ความเป็นเจ้าของรายการลงทะเบียน
  - ปรับสถานะเป็น `DROPPED` และคืนที่นั่งว่างให้ผู้อื่นทันที
  - บันทึก Audit Log เหตุการณ์ `DROP_COURSE`
- **Weekly Schedule Timetable API (`GET /api/v1/student/schedule`)**:
  - ดึงข้อมูลคาบเรียนของวิชาที่ลงทะเบียน จัดเรียงตามวันในสัปดาห์และเวลาเรียน

### 2. Frontend Implementation (`frontend/src/`)
- **Authentication & Global State**:
  - `src/contexts/AuthContext.tsx`: จัดการ Token, Session, และการตรวจสอบความถูกต้องของสิทธิ์
  - `src/services/api.ts`: Axios Client พร้อม Interceptor แปะ JWT Bearer Header
- **Layout & Navigation**:
  - `src/layouts/StudentLayout.tsx`: Header พร้อมแสดงโปรไฟล์นักศึกษา, รหัส, สาขา, เมนูนำทางแบบ Tabs และปุ่ม Logout
- **Pages**:
  - `src/pages/auth/LoginPage.tsx`: หน้า Login พร้อมปุ่ม 1-Click Demo Accounts (John Doe, Jane Smith, Alan Turing, Admin)
  - `src/pages/student/StudentDashboardPage.tsx`: แดชบอร์ดสรุปสถิติ (วิชาที่ลง, หน่วยกิต, สถานะการศึกษา, ป้ายบอกสถานะเทอม) และรายการวิชาลงทะเบียน
  - `src/pages/student/CourseSearchPage.tsx`: หน้าค้นหารายวิชา พร้อมการแสดงผล Sections, แถบวัดที่นั่งว่าง (Capacity Bar), ตารางเรียน, และปุ่มกดลงทะเบียนแบบ Real-time Feedback
  - `src/pages/student/MyCoursesPage.tsx`: หน้ารายวิชาที่ลงทะเบียนแล้ว ตารางสรุปเวลาเรียน อาจารย์ผู้สอน พร้อมปุ่ม Drop Course และ Modal ยืนยัน
  - `src/pages/student/StudentSchedulePage.tsx`: หน้าตารางเรียนแบบ Grid รายวัน (Monday - Friday / Sunday) แยกสีสันตามวัน พร้อมปุ่มพิมพ์ตารางเรียน (Print Timetable)
- **Routing**:
  - `src/routes/AppRoutes.tsx`: ป้องกันเส้นทางด้วย `ProtectedRoute` สำหรับ Role `STUDENT`

---

## Files Created
- `backend/src/students/students.module.ts`
- `backend/src/students/students.service.ts`
- `backend/src/students/students.controller.ts`
- `backend/src/students/dto/enroll-course.dto.ts`
- `backend/src/students/dto/course-search-query.dto.ts`
- `backend/test/student.e2e-spec.ts`
- `frontend/src/types/index.ts`
- `frontend/src/services/api.ts`
- `frontend/src/services/studentService.ts`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/layouts/StudentLayout.tsx`
- `frontend/src/pages/auth/LoginPage.tsx`
- `frontend/src/pages/student/StudentDashboardPage.tsx`
- `frontend/src/pages/student/CourseSearchPage.tsx`
- `frontend/src/pages/student/MyCoursesPage.tsx`
- `frontend/src/pages/student/StudentSchedulePage.tsx`
- `frontend/src/routes/AppRoutes.tsx`
- `PHASE_5_REPORT.md`

## Files Modified
- `backend/src/app.module.ts` (นำเข้า `StudentsModule`)
- `frontend/src/App.tsx` (เชื่อมต่อ `BrowserRouter`, `AuthProvider`, และ `AppRoutes`)

## Database Changes
- ข้อมูลในตาราง `enrollments` มีการบันทึกการลงทะเบียนและการถอนวิชาตามผลการทดสอบ
- ข้อมูลในตาราง `audit_logs` มีการบันทึกเหตุการณ์ `REGISTER_COURSE` และ `DROP_COURSE`

## API Changes
- เพิ่ม Student Endpoints:
  - `GET /api/v1/student/profile`
  - `GET /api/v1/student/courses`
  - `GET /api/v1/student/enrollments`
  - `POST /api/v1/student/enrollments`
  - `DELETE /api/v1/student/enrollments/:id`
  - `GET /api/v1/student/schedule`

## Tests
- **Student Module E2E Tests (`test/student.e2e-spec.ts`)**: ผ่าน 11/11 ข้อ
  1. ดึงข้อมูลโปรไฟล์นักศึกษาพร้อมสถิติเทอมปัจจุบัน -> 200 OK
  2. ปฏิเสธการเข้าถึงเมื่อไม่มี Token -> 401 Unauthorized
  3. ปฏิเสธการเข้าถึงสำหรับ Role อื่น (Teacher) -> 403 Forbidden
  4. ค้นหารายวิชาที่เปิดสอนพร้อม Sections และตารางเวลา -> 200 OK
  5. กรองรายวิชาตามคำค้นหา (Keyword search) -> 200 OK
  6. ลงทะเบียนเรียนใน Section ที่ว่าง -> 201 Created
  7. ปฏิเสธการลงทะเบียนวิชาเดิมซ้ำในเทอมเดียวกัน -> 409 Conflict
  8. ตรวจสอบความถูกต้องของ UUID format ใน DTO -> 400 Bad Request
  9. ดึงข้อมูลตารางเรียนประจำสัปดาห์ (Weekly Timetable) -> 200 OK
  10. ถอนรายวิชาที่ลงทะเบียน (Drop Course) -> 200 OK
  11. ปฏิเสธการถอนวิชาที่ถูกถอนไปแล้วซ้ำ -> 400 Bad Request
- **Auth Module E2E Tests (`test/auth.e2e-spec.ts`)**: ผ่าน 16/16 ข้อ
- **Backend Unit Tests**: ผ่าน 1/1 ข้อ
- **Backend Build (`nest build`)**: ผ่านเรียบร้อย
- **Frontend Build (`tsc -b && vite build`)**: ผ่านเรียบร้อย (724ms, 0 errors)

## Test Results
- PASS (E2E Tests: 27/27 ผ่านทั้งหมด 100%, Unit Test: 1/1 ผ่าน, Build Frontend/Backend: ผ่านสมบูรณ์)

## Errors
1. Interactive transaction timeout บน Prisma เกิดขึ้นเมื่อรันหลาย query ต่อเนื่องบน Serverless Cloud DB
2. TypeScript `verbatimModuleSyntax` บน Frontend ต้องการ `import type { ... }`
3. Unique constraint error เมื่อนักศึกษาลงทะเบียนใน section เดิมที่เคย drop ไปแล้ว

## Fixes
1. ตั้งค่า timeout ให้ transaction (`{ maxWait: 15000, timeout: 30000 }`) และแยก Audit Log ออกมาบันทึกนอก transaction
2. ปรับปรุง import statement ให้เป็น `import type` ทุกไฟล์บน Frontend
3. เพิ่ม Logic ตรวจสอบว่าหากมีรายการ enrollment เดิมที่มีสถานะ DROPPED อยู่ ให้ทำ update สถานะกลับเป็น REGISTERED แทนการ INSERT ซ้ำ

## Known Issues
- ไม่มี

## Next Phase
- **PHASE 6 — Teacher Module**:
  - Backend: สร้าง Teacher Courses API (ดูวิชาที่ตนเองสอน), Student List API (ดูรายชื่อนักศึกษาใน Section), Teaching Schedule API (ตารางสอน)
  - Frontend: สร้าง Teacher Dashboard, My Teaching Courses, Section Students List, และ Teaching Schedule Timetable

---

## Approval Required

STOP

Waiting for user approval.
