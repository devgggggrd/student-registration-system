# Database Architecture Plan
## Student Registration System (ระบบลงทะเบียนนักศึกษา)

---

### 1. Database Overview
- **Database Engine**: PostgreSQL 16+
- **ORM**: Prisma ORM
- **Migration Strategy**: Prisma Migrate (`prisma migrate dev`, `prisma migrate deploy`)
- **Naming Convention**: `snake_case` สำหรับ table/column ใน database, `camelCase` ใน application level

---

### 2. Enums

```prisma
enum Role {
  STUDENT
  TEACHER
  ADMIN
}

enum StudentStatus {
  ACTIVE
  SUSPENDED
  GRADUATED
  DROPPED_OUT
}

enum SemesterStatus {
  UPCOMING
  OPEN
  CLOSED
  FINISHED
}

enum EnrollmentStatus {
  REGISTERED
  DROPPED
  CANCELLED
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}
```

---

### 3. Entity Definitions & Schemas

#### 3.1 `users`
ตารางจัดเก็บบัญชีผู้ใช้งานระบบและบทบาท
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role Role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### 3.2 `departments`
ตารางภาควิชา/สาขาวิชา
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_departments_code ON departments(code);
```

#### 3.3 `students`
ข้อมูลโปรไฟล์ของนักศึกษา เชื่อมกับ `users`
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  year_level INT NOT NULL CHECK (year_level >= 1 AND year_level <= 8),
  status StudentStatus DEFAULT 'ACTIVE' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_students_student_code ON students(student_code);
CREATE INDEX idx_students_department ON students(department_id);
```

#### 3.4 `teachers`
ข้อมูลโปรไฟล์ของอาจารย์ เชื่อมกับ `users`
```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_teachers_teacher_code ON teachers(teacher_code);
CREATE INDEX idx_teachers_department ON teachers(department_id);
```

#### 3.5 `courses`
ข้อมูลรายวิชา
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code VARCHAR(20) UNIQUE NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  credits INT NOT NULL CHECK (credits > 0 AND credits <= 12),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_courses_course_code ON courses(course_code);
CREATE INDEX idx_courses_department ON courses(department_id);
```

#### 3.6 `semesters`
ข้อมูลภาคการศึกษาและช่วงเวลาเปิดลงทะเบียน
```sql
CREATE TABLE semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year INT NOT NULL,
  semester_number INT NOT NULL CHECK (semester_number >= 1 AND semester_number <= 3),
  registration_start TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_end TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status SemesterStatus DEFAULT 'UPCOMING' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_semester_year UNIQUE (academic_year, semester_number),
  CONSTRAINT chk_reg_dates CHECK (registration_start < registration_end),
  CONSTRAINT chk_term_dates CHECK (start_date < end_date)
);
CREATE INDEX idx_semesters_status ON semesters(status);
```

#### 3.7 `course_sections`
กลุ่มเรียน (Section) ของรายวิชาในแต่ละภาคการศึกษา
```sql
CREATE TABLE course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
  section_number INT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  capacity INT NOT NULL CHECK (capacity > 0),
  room VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_section_course_semester UNIQUE (course_id, semester_id, section_number)
);
CREATE INDEX idx_course_sections_course ON course_sections(course_id);
CREATE INDEX idx_course_sections_semester ON course_sections(semester_id);
CREATE INDEX idx_course_sections_teacher ON course_sections(teacher_id);
```

#### 3.8 `schedules`
ตารางเวลาเรียนของแต่ละ Section
```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  day_of_week DayOfWeek NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_schedule_time CHECK (start_time < end_time)
);
CREATE INDEX idx_schedules_section ON schedules(course_section_id);
CREATE INDEX idx_schedules_day_time ON schedules(day_of_week, start_time, end_time);
```

#### 3.9 `enrollments`
บันทึกการลงทะเบียนรายวิชาของนักศึกษา
```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  course_section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE RESTRICT,
  semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
  status EnrollmentStatus DEFAULT 'REGISTERED' NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_student_section UNIQUE (student_id, course_section_id)
);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_section ON enrollments(course_section_id);
CREATE INDEX idx_enrollments_semester ON enrollments(semester_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
```

#### 3.10 `audit_logs`
บันทึกกิจกรรมสำคัญในระบบเพื่อการตรวจสอบย้อนหลัง
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

### 4. Concurrency & Integrity Strategy (การจัดการความถูกต้องและโหลดพร้อมกัน)
1. **Pessimistic Locking / Row Level Lock**:
   - เมื่อนักศึกษาดำเนินการลงทะเบียน Endpoint จะเปิด `prisma.$transaction`
   - รันคำสั่ง query count ที่นั่งที่ใช้ไปแล้วใน `course_sections` พร้อมตรวจ capacity
   - ใน PostgreSQL สามารถใช้การนับ `COUNT(*) WHERE status = 'REGISTERED'` หรือเก็บฟิลด์ `enrolled_count` ใน `course_sections` แล้วใช้ `SELECT ... FOR UPDATE` เพื่อล็อคแถวของ section ขณะทำการบันทึก
2. **Schedule Conflict Check**:
   - ค้นหารายการ `schedules` ของ section ใหม่
   - เทียบกับ `schedules` ของทุก section ที่นักศึกษาลงทะเบียนในภาคการศึกษานั้นที่มี `status = 'REGISTERED'`
   - เงื่อนไขชนกัน: `day_of_week` ตรงกัน AND `(new_start < existing_end) AND (new_end > existing_start)`
3. **Duplicate Course Check**:
   - ตรวจสอบว่าใน semester เดียวกัน นักศึกษาได้ลงทะเบียนวิชาใดๆ ที่มี `course_id` เดียวกันไปแล้วหรือไม่ (ไม่ว่าจะคนละ Section หรือไม่) ป้องกันการลงทะเบียนวิชาเดียวกัน 2 กลุ่ม
