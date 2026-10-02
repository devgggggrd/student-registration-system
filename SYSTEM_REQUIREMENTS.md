# System Requirements Document (SRD)
## Student Registration System (ระบบลงทะเบียนนักศึกษา)

---

### 1. บทนำและขอบเขตของระบบ (Introduction & Scope)
ระบบลงทะเบียนนักศึกษาสำหรับสถานศึกษา รองรับผู้ใช้งาน 3 กลุ่มหลัก:
- **นักศึกษา (Student)**: ค้นหาหลักสูตร/รายวิชา, ลงทะเบียนเรียน, ถอนรายวิชา, ดูตารางเรียน, ดูประวัติการลงทะเบียน, ดูโปรไฟล์
- **อาจารย์ (Teacher)**: ดูรายวิชาที่รับผิดชอบสอน, ดูตารางสอน, ดูรายชื่อนักศึกษาใน Section
- **ผู้ดูแลระบบ (Admin / Registrar)**: จัดการบัญชีผู้ใช้, ข้อมูลภาควิชา/คณะ, ข้อมูลหลักสูตรและรายวิชา, จัดการภาคการศึกษา, เปิด/ปิดช่วงเวลาลงทะเบียน, กำหนด Section และตารางเรียน, ตรวจสอบภาพรวมการลงทะเบียน

---

### 2. ขอบเขตฟังก์ชันการทำงานเวอร์ชัน 1 (V1 Scope)

#### 2.1 สิทธิ์และหน้าที่ตามบทบาท (Role-Based Features)
1. **Authentication & Authorization**
   - ลงชื่อเข้าใช้งานด้วย Email/Username + Password
   - มีระบบจำแนก Role: `STUDENT`, `TEACHER`, `ADMIN`
   - การยืนยันตัวตนด้วย Access Token (JWT) และ Refresh Token
   - สิทธิ์การเข้าถึงแต่ละ API Endpoint ควบคุมด้วย Guards / RBAC Middleware

2. **Student Functionality**
   - ดูข้อมูลส่วนตัว (รหัสนักศึกษา, ชื่อ-นามสกุล, สาขา, ชั้นปี, หน่วยกิตรวม)
   - ค้นหารายวิชาที่เปิดสอนตามภาคการศึกษา (ค้นหาด้วย รหัสวิชา, ชื่อวิชา, อาจารย์ผู้สอน, ภาควิชา)
   - ลงทะเบียนรายวิชาตามเงื่อนไขทางธุรกิจ
   - ถอนรายวิชาที่ลงทะเบียนไว้
   - ดูตารางเรียนประจำสัปดาห์ (Weekly Timetable)
   - ดูรายวิชาและสถานะการลงทะเบียน

3. **Teacher Functionality**
   - ดูรายการวิชาและ Section ที่ได้รับมอบหมายให้สอนในแต่ละภาคการศึกษา
   - ดูรายชื่อนักศึกษาในแต่ละ Section พร้อมรายละเอียด (รหัส, ชื่อ-นามสกุล, สาขา, ชั้นปี)
   - ดูตารางสอนประจำสัปดาห์

4. **Admin / Registrar Functionality**
   - จัดการข้อมูลนักศึกษา (CRUD)
   - จัดการข้อมูลอาจารย์ (CRUD)
   - จัดการข้อมูลภาควิชา (Departments CRUD)
   - จัดการรายวิชา (Courses CRUD)
   - จัดการภาคการศึกษา (Semesters CRUD) กำหนดปีการศึกษา เทอม วันที่เปิด-ปิดระบบลงทะเบียน
   - จัดการ Section (เปิด Section, กำหนดห้องเรียน, ความจุที่นั่ง Capacity, มอบหมายผู้สอน)
   - จัดการตารางเรียน (วันในสัปดาห์, เวลาเริ่มต้น-สิ้นสุด, ห้องเรียน)
   - ดูสถิติและข้อมูลการลงทะเบียนทั้งหมด

---

### 3. กฎทางธุรกิจและเงื่อนไขการลงทะเบียน (Business Rules & Constraints)
1. **สถานะการลงทะเบียน (Registration Window)**: นักศึกษาจะลงทะเบียนได้เฉพาะในภาคการศึกษาที่มีสถานะเป็น `OPEN` และเวลาปัจจุบันอยู่ในช่วง `registration_start` ถึง `registration_end` เท่านั้น
2. **การป้องกันวิชาซ้ำ (No Duplicate Registration)**: นักศึกษาไม่สามารถลงทะเบียนวิชาเดิมหรือ Section เดิมซ้ำในภาคการศึกษาเดียวกัน
3. **การจำกัดจำนวนที่นั่ง (Capacity Limit)**: จำนวนนักศึกษาที่ลงทะเบียนสำเร็จใน Section ต้องไม่เกิน `capacity`
4. **การตรวจสอบตารางเรียนชนกัน (Schedule Conflict Detection)**: นักศึกษาไม่สามารถลงทะเบียนเรียน Section ที่มีช่วงเวลาเรียน (วัน และ เวลา) คาบเกี่ยวกับวิชาที่ลงทะเบียนสำเร็จไปแล้ว
5. **การทำงานแบบ Atomic Transaction (Concurrency & Transaction Safety)**: การลงทะเบียนและการอัปเดตที่นั่งต้องทำงานภายใน Database Transaction ระดับ Serializable หรือใช้ Row Locking (`SELECT ... FOR UPDATE`) เพื่อป้องกันปัญหา Overbooking เมื่อมีคำขอเข้ามาพร้อมกัน (Race Conditions)
6. **สถานะการลงทะเบียน (Enrollment Status)**: รองรับสถานะ `REGISTERED`, `DROPPED`, `CANCELLED`

---

### 4. รายการที่ยังไม่ทำใน Version 1 (Out of Scope for V1)
- ระบบตัดเกรด / บันทึกผลการเรียน (Grade System)
- ใบแสดงผลการเรียน (Transcript Generation)
- ระบบชำระเงินค่าลงทะเบียน / ค่าธรรมเนียม (Tuition Payment & Billing)
- ระบบการเรียนออนไลน์ / ส่งการบ้าน (LMS / Assignments)
- ระบบจัดสอบและตารางสอบ (Exam Management)
- ระบบเช็กชื่อเข้าเรียน (Attendance Tracking)
- แอปพลิเคชันมือถือ (Mobile Native App)

---

### 5. ความต้องการด้าน Non-Functional Requirements (NFR)
1. **Security**:
   - เข้ารหัสรหัสผ่านด้วย bcrypt (salt rounds >= 10)
   - สื่อสารผ่าน HTTPS
   - ป้องกัน SQL Injection โดยใช้ Prisma Parameterized Queries
   - ป้องกัน XSS และ Injection ผ่าน class-validator (DTO whitelist & sanitize)
   - จำกัดความถี่การร้องขอ (Rate Limiting) สำหรับ Auth Endpoints
2. **Reliability & Consistency**:
   - ACID Compliant สำหรับระบบ Transaction การลงทะเบียน
   - Audit Logging บันทึกการกระทำสำคัญ เช่น การลงทะเบียน, ถอนวิชา, การแก้ไขข้อมูลโดย Admin
3. **Performance**:
   - การค้นหารายวิชาและดึงตารางเรียนต้องตอบสนองภายใน < 300ms
   - รองรับการลงทะเบียนพร้อมกัน (Concurrent Users) โดยข้อมูลที่นั่งไม่ผิดพลาด
4. **Maintainability**:
   - โครงสร้างแบบ Modular (NestJS Modules)
   - Type Safety แบบ End-to-End (TypeScript ทั้ง Frontend และ Backend)
