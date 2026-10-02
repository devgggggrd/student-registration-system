# API Specification Plan
## Student Registration System (ระบบลงทะเบียนนักศึกษา)

---

### 1. API Architecture Overview
- **Base URL**: `/api/v1`
- **Protocol**: HTTP/1.1 over TLS (HTTPS)
- **Format**: JSON (`Content-Type: application/json`)
- **Authentication**: HTTP Header `Authorization: Bearer <access_token>`
- **Response Standard Structure**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2026-10-02T00:00:00.000Z"
}
```
- **Error Standard Structure**:
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["Detailed validation or business rule error message"],
  "timestamp": "2026-10-02T00:00:00.000Z"
}
```

---

### 2. Authentication & Authorization Endpoints (`/api/v1/auth`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | ลงชื่อเข้าใช้ (รับ email/username + password) คืนค่า accessToken, refreshToken, user profile & role |
| `POST` | `/auth/refresh` | Public | ขอ Access Token ใหม่โดยส่ง Refresh Token ใน payload |
| `POST` | `/auth/logout` | Authenticated | ออกจากระบบ ยกเลิก Session/Token |
| `GET` | `/auth/me` | Authenticated | ตรวจสอบข้อมูลโปรไฟล์และสิทธิ์ของผู้ใช้ปัจจุบัน |

---

### 3. Student Endpoints (`/api/v1/student`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/student/profile` | STUDENT | ดึงข้อมูลโปรไฟล์ของนักศึกษาที่กำลัง Login (ชื่อ, สาขา, ชั้นปี) |
| `GET` | `/student/courses` | STUDENT | ค้นหารายวิชาที่เปิดสอนในภาคการศึกษาปัจจุบัน (รองรับ filter code, name, dept) |
| `GET` | `/student/courses/:id/sections` | STUDENT | ดูรายละเอียด Sections และตารางเรียนของรายวิชา |
| `GET` | `/student/enrollments` | STUDENT | ดึงรายการวิชาที่ตนเองลงทะเบียนในภาคการศึกษาที่เลือก |
| `POST` | `/student/enrollments` | STUDENT | ลงทะเบียนเรียนใน Section ที่ระบุ (ตรวจสอบ capacity, semester open, schedule clash) |
| `DELETE` | `/student/enrollments/:id` | STUDENT | ถอนรายวิชาที่ลงทะเบียนไว้ |
| `GET` | `/student/schedule` | STUDENT | ดึงตารางเรียนประจำสัปดาห์ (Timetable) ของตนเอง |

---

### 4. Teacher Endpoints (`/api/v1/teacher`)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/teacher/profile` | TEACHER | ดึงข้อมูลโปรไฟล์ของอาจารย์ |
| `GET` | `/teacher/courses` | TEACHER | ดูรายการรายวิชาและ Section ที่อาจารย์เป็นผู้สอนในแต่ละภาคการศึกษา |
| `GET` | `/teacher/sections/:sectionId/students` | TEACHER | ดูรายชื่อนักศึกษาทั้งหมดที่ลงทะเบียนใน Section นั้น |
| `GET` | `/teacher/schedule` | TEACHER | ดึงตารางสอนประจำสัปดาห์ของอาจารย์ |

---

### 5. Admin Endpoints (`/api/v1/admin`)

#### 5.1 Department Management
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/admin/departments` | ADMIN | ดึงรายการภาควิชาทั้งหมด |
| `POST` | `/admin/departments` | ADMIN | เพิ่มภาควิชาใหม่ |
| `PUT` | `/admin/departments/:id` | ADMIN | แก้ไขข้อมูลภาควิชา |
| `DELETE` | `/admin/departments/:id` | ADMIN | ลบภาควิชา (ตรวจสอบ foreign key ก่อนลบ) |

#### 5.2 Course Management
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/admin/courses` | ADMIN | ดึงรายการวิชาทั้งหมดพร้อม Pagination |
| `POST` | `/admin/courses` | ADMIN | สร้างรายวิชาใหม่ (รหัสวิชา, ชื่อ, หน่วยกิต, ภาควิชา) |
| `GET` | `/admin/courses/:id` | ADMIN | ดูรายละเอียดวิชา |
| `PUT` | `/admin/courses/:id` | ADMIN | แก้ไขรายวิชา |
| `DELETE` | `/admin/courses/:id` | ADMIN | ลบรายวิชา |

#### 5.3 Semester Management
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/admin/semesters` | ADMIN | รายการภาคการศึกษาทั้งหมด |
| `POST` | `/admin/semesters` | ADMIN | สร้างภาคการศึกษาใหม่ (ปีการศึกษา, เทอม, วันที่เริ่ม-สิ้นสุด, ช่วงลงทะเบียน) |
| `PATCH` | `/admin/semesters/:id/status` | ADMIN | เปลี่ยนสถานะภาคการศึกษา (`UPCOMING`, `OPEN`, `CLOSED`, `FINISHED`) |
| `PUT` | `/admin/semesters/:id` | ADMIN | แก้ไขรายละเอียดภาคการศึกษา |

#### 5.4 Course Section & Schedule Management
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/admin/sections` | ADMIN | ค้นหาและดูรายการ Sections ทั้งหมด |
| `POST` | `/admin/sections` | ADMIN | สร้าง Section ใหม่ กำหนดวิชา, เทอม, อาจารย์ผู้สอน, ความจุ (capacity), ห้องเรียน |
| `PUT` | `/admin/sections/:id` | ADMIN | แก้ไข Section |
| `DELETE` | `/admin/sections/:id` | ADMIN | ลบ Section |
| `POST` | `/admin/sections/:id/schedules` | ADMIN | กำหนดวัน-เวลาตารางเรียนให้กับ Section |
| `DELETE` | `/admin/schedules/:id` | ADMIN | ลบเวลาเรียนออกจาก Section |

#### 5.5 Student & Teacher Management
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/admin/students` | ADMIN | ดึงรายชื่อนักศึกษาทั้งหมด พร้อมตัวกรอง |
| `POST` | `/admin/students` | ADMIN | สร้างบัญชีผู้ใช้และโปรไฟล์นักศึกษาใหม่ |
| `PUT` | `/admin/students/:id` | ADMIN | แก้ไขข้อมูลนักศึกษา |
| `GET` | `/admin/teachers` | ADMIN | ดึงรายชื่ออาจารย์ทั้งหมด |
| `POST` | `/admin/teachers` | ADMIN | สร้างบัญชีผู้ใช้และโปรไฟล์อาจารย์ใหม่ |
| `PUT` | `/admin/teachers/:id` | ADMIN | แก้ไขข้อมูลอาจารย์ |

#### 5.6 Enrollment Overview & Audit Logs
| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/admin/enrollments` | ADMIN | ดูสถิติและข้อมูลการลงทะเบียนทั้งหมดในระบบ |
| `GET` | `/admin/audit-logs` | ADMIN | ดูประวัติการกระทำในระบบ (Audit Trail) |
| `GET` | `/admin/dashboard-stats` | ADMIN | ดึงสรุปจำนวนนักศึกษา, อาจารย์, วิชา, และจำนวนการลงทะเบียน |

---

### 6. Validation & Error Handling
- ทุก Request Payload จะถูกตรวจสอบด้วย DTO (Data Transfer Object) ร่วมกับ `class-validator` และ `class-transformer`
- ปฏิเสธ Unexpected fields (`whitelist: true`, `forbidNonWhitelisted: true`)
- HTTP Status Codes:
  - `200 OK`: สำเร็จ
  - `201 Created`: สร้างข้อมูลสำเร็จ
  - `400 Bad Request`: Payload ผิดพลาด หรือเงื่อนไขทางธุรกิจไม่ผ่าน (เช่น ที่นั่งเต็ม, ตารางชน)
  - `401 Unauthorized`: ไม่ได้ส่ง Token หรือ Token หมดอายุ
  - `403 Forbidden`: สิทธิ์ไม่ถึง (RBAC ปฏิเสธ)
  - `404 Not Found`: ไม่พบ Resource
  - `409 Conflict`: ข้อมูลซ้ำ (เช่น ลงทะเบียนซ้ำ, รหัสวิชาซ้ำ)
  - `500 Internal Server Error`: ปัญหาฝั่งเซิร์ฟเวอร์
