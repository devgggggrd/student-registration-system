# Student Registration System (ระบบลงทะเบียนเรียนมหาวิทยาลัย)

ระบบลงทะเบียนเรียนมหาวิทยาลัยระดับ Enterprise พัฒนาด้วย NestJS 10 + TypeScript + Prisma ORM 7 + PostgreSQL on Neon Cloud (Backend) และ React 18 + Vite 8 + TypeScript + Tailwind CSS (Frontend)

---

## 🌟 Key Features

1. **Multi-Role User Experience (3 Roles)**:
   - **Student (นิสิต/นักศึกษา)**: ค้นหารายวิชา, กรองตามภาควิชา, ลงทะเบียนเรียนแบบ Concurrency Safe, แสดงตารางเรียนรายสัปดาห์, พิมพ์ตารางเรียน, และถอนรายวิชา
   - **Faculty / Teacher (อาจารย์ผู้สอน)**: ตรวจสอบกลุ่มเรียนที่สอน, ตรวจสอบรายชื่อนิสิตในห้องเรียน (Class Roster), แสดงตารางสอนรายสัปดาห์
   - **Academic Administrator (ผู้ดูแลระบบ/นายทะเบียน)**: บริหารจัดการผู้ใช้งาน (แก้ไขชื่อ อีเมล เบอร์โทร รหัสผ่าน สาขา สถานะ), จัดการหลักสูตรรายวิชา, จัดการกลุ่มเรียน (Sections), กำหนดวันเปิด-ปิดภาคการศึกษา, และตรวจสอบบันทึกความปลอดภัย (Audit Logs)
2. **High-Concurrency Seat Booking**:
   - ป้องกันปัญหา Race Condition ด้วยฐานข้อมูล Pessimistic Row Locking (`SELECT ... FOR UPDATE`)
   - ป้องกันการลงทะเบียนซ้ำ, ที่นั่งเกิน (Overbooking), และคืนที่นั่งว่างทันทีเมื่อมีการถอนรายวิชา
3. **Registration Business Rules**:
   - ตรวจสอบการชนกันของตารางเรียน (Schedule Conflict Detection) โดยอนุญาตเวลาติดกัน (Adjacent Boundary) ได้
   - จำกัดจำนวนหน่วยกิตสะสมสูงสุด 22 หน่วยกิตต่อภาคเรียน
   - บังคับการผ่านวิชาบังคับก่อน (Prerequisites)
   - ตรวจสอบสถานะนิสิต (`ACTIVE` เท่านั้นที่ลงทะเบียนได้)
4. **Enterprise Security Hardening**:
   - Security Headers ด้วย `helmet` (`nosniff`, `SAMEORIGIN`, CSP)
   - Rate Limiting / Request Throttling ด้วย `@nestjs/throttler` (120 req/min)
   - การป้องกัน Broken Object Level Authorization (BOLA/IDOR)
   - ป้องกัน SQL Injection ด้วย Prisma Parameterized Queries
   - ป้องกัน XSS ด้วย React Auto-escaping และ `ValidationPipe`
   - เก็บบันทึกประวัติความปลอดภัย (Audit Trail) ครบถ้วน
5. **Production Deployment Ready**:
   - Multi-stage Dockerfiles สำหรับ Backend และ Frontend
   - Docker Compose พร้อมระบบตรวจสอบความพร้อมของบริการ (Health Check)
   - เอกสาร Interactive OpenAPI / Swagger UI ที่ `/api/docs`

---

## 🚀 Quick Start Guide

### 1. Requirements
- Node.js >= 20 LTS
- npm >= 10
- PostgreSQL (หรือ Neon Cloud)

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npx ts-node prisma/seed.ts
npm run start:dev
```
Backend API will be running on: `http://localhost:3000/api/v1`  
Swagger API Docs available on: `http://localhost:3000/api/docs`

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend Web UI will be running on: `http://localhost:5173`

### 4. Running with Docker Compose
```bash
docker compose up -d --build
```
- Frontend: `http://localhost:80`
- Backend API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`

---

## 👥 Default Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| **ADMIN** | System Administrator | `admin@reg.edu` | `Admin@1234` |
| **TEACHER** | Alan Turing | `teacher1@reg.edu` | `Password@123` |
| **TEACHER** | Grace Hopper | `teacher2@reg.edu` | `Password@123` |
| **STUDENT** | John Doe (6601001) | `student1@reg.edu` | `Password@123` |
| **STUDENT** | Jane Smith (6601002) | `student2@reg.edu` | `Password@123` |
| **STUDENT** | Bob Dylan (6501001) | `student3@reg.edu` | `Password@123` |

---

## 🧪 Automated Test Suite (73/73 Passed)

```bash
cd backend
npm run test:e2e
```

| Test Suite | File | Tests |
|---|---|:---:|
| Authentication & RBAC | `test/auth.e2e-spec.ts` | 16 |
| Student Workflows | `test/student.e2e-spec.ts` | 11 |
| Faculty Workflows | `test/teacher.e2e-spec.ts` | 9 |
| Administrative Governance | `test/admin.e2e-spec.ts` | 15 |
| Concurrency & Race Conditions | `test/concurrency-edge-cases.e2e-spec.ts` | 7 |
| Cross-Module Integration Lifecycle | `test/integration-flow.e2e-spec.ts` | 5 |
| Security Penetration Testing | `test/security.e2e-spec.ts` | 10 |
| **Total Automated Tests** | **7 Suites** | **73 / 73 PASSED** |

---

## 📚 Documentation Links
- [`docs/API_DOCUMENTATION.md`](file:///Users/gggrd_/.gemini/antigravity-ide/scratch/student-registration-system/docs/API_DOCUMENTATION.md) — REST API Endpoints Specification
- [`docs/ADMIN_OPERATIONAL_RUNBOOK.md`](file:///Users/gggrd_/.gemini/antigravity-ide/scratch/student-registration-system/docs/ADMIN_OPERATIONAL_RUNBOOK.md) — Operational & Disaster Recovery Runbook
- [`docs/USER_MANUAL.md`](file:///Users/gggrd_/.gemini/antigravity-ide/scratch/student-registration-system/docs/USER_MANUAL.md) — Comprehensive User Manual (Students, Faculty, Admins)
- [`PHASE_12_REPORT.md`](file:///Users/gggrd_/.gemini/antigravity-ide/scratch/student-registration-system/PHASE_12_REPORT.md) — Final System Delivery & Sign-off Report
