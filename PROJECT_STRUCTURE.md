# Project Structure Plan
## Student Registration System (ระบบลงทะเบียนนักศึกษา)

---

### 1. Root Directory Layout
```text
student-registration-system/
├── backend/                  # NestJS Application
├── frontend/                 # React + Vite + TypeScript Application
├── docker-compose.yml        # Docker compose สำหรับ local development (PostgreSQL, etc.)
├── .env.example              # ตัวอย่าง Environment Variables รวม
├── .gitignore                # Git ignore rules
├── README.md                 # Project Overview & Setup Instructions
├── SYSTEM_REQUIREMENTS.md    # แผนความต้องการของระบบ
├── DATABASE_PLAN.md          # แผนโครงสร้างฐานข้อมูล
├── API_PLAN.md               # แผนและสเปก API
├── PROJECT_STRUCTURE.md      # โครงสร้างโปรเจกต์
└── PHASE_1_REPORT.md         # รายงานสรุปผล Phase 1
```

---

### 2. Backend Directory Layout (`backend/`)
ใช้ NestJS โมดูลาร์ตาม Best Practices:

```text
backend/
├── prisma/
│   ├── schema.prisma         # Prisma schema definition
│   ├── migrations/           # Database migration files
│   └── seed.ts               # Database seed script
├── src/
│   ├── auth/                 # Authentication & JWT & RBAC
│   │   ├── dto/              # Login, Refresh, Register DTOs
│   │   ├── guards/           # JwtAuthGuard, RolesGuard
│   │   ├── strategies/       # JwtStrategy, RefreshJwtStrategy
│   │   ├── decorators/       # Roles decorator, CurrentUser decorator
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/                # User accounts management
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── students/             # Student profile & APIs
│   │   ├── dto/
│   │   ├── students.controller.ts
│   │   ├── students.service.ts
│   │   └── students.module.ts
│   ├── teachers/             # Teacher profile & APIs
│   │   ├── dto/
│   │   ├── teachers.controller.ts
│   │   ├── teachers.service.ts
│   │   └── teachers.module.ts
│   ├── departments/          # Department CRUD
│   │   ├── dto/
│   │   ├── departments.controller.ts
│   │   ├── departments.service.ts
│   │   └── departments.module.ts
│   ├── courses/              # Course CRUD
│   │   ├── dto/
│   │   ├── courses.controller.ts
│   │   ├── courses.service.ts
│   │   └── courses.module.ts
│   ├── semesters/            # Semester management
│   │   ├── dto/
│   │   ├── semesters.controller.ts
│   │   ├── semesters.service.ts
│   │   └── semesters.module.ts
│   ├── course-sections/      # Course sections & schedules
│   │   ├── dto/
│   │   ├── course-sections.controller.ts
│   │   ├── course-sections.service.ts
│   │   └── course-sections.module.ts
│   ├── enrollments/          # Registration engine & logic
│   │   ├── dto/
│   │   ├── enrollments.controller.ts
│   │   ├── enrollments.service.ts # Capacity lock, clash checking, atomic tx
│   │   └── enrollments.module.ts
│   ├── admin/                # Admin aggregate APIs & audit
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   └── admin.module.ts
│   ├── common/               # Shared utilities, filters, interceptors
│   │   ├── filters/          # HttpExceptionFilter
│   │   ├── interceptors/     # TransformResponseInterceptor, LoggingInterceptor
│   │   ├── exceptions/       # Custom domain exceptions
│   │   └── constants/        # System constants
│   ├── database/             # Prisma client wrapper module
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.module.ts         # Root module
│   └── main.ts               # Entrypoint (Port, CORS, GlobalPipes)
├── test/                     # E2E & integration tests
├── .env.example
├── tsconfig.json
├── nest-cli.json
└── package.json
```

---

### 3. Frontend Directory Layout (`frontend/`)
ใช้ React 18+ / Vite + TypeScript + Tailwind CSS:

```text
frontend/
├── public/                   # Static assets, favicon
├── src/
│   ├── assets/               # Images, icons, svg
│   ├── components/           # Reusable UI components
│   │   ├── common/           # Button, Input, Modal, Badge, Table, Card, Loader
│   │   ├── feedback/         # Toast, Alert, ConfirmDialog
│   │   └── timetable/        # Weekly schedule visual grid
│   ├── layouts/              # Main layout wrappers
│   │   ├── AuthLayout.tsx    # Clean layout for login
│   │   ├── DashboardLayout.tsx # Sidebar + Header + Breadcrumb + Content
│   │   └── Navbar.tsx / Sidebar.tsx
│   ├── pages/                # Page views
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── student/
│   │   │   ├── StudentDashboardPage.tsx
│   │   │   ├── CourseSearchPage.tsx
│   │   │   ├── CourseRegistrationPage.tsx
│   │   │   ├── MyCoursesPage.tsx
│   │   │   └── StudentSchedulePage.tsx
│   │   ├── teacher/
│   │   │   ├── TeacherDashboardPage.tsx
│   │   │   ├── TeacherCoursesPage.tsx
│   │   │   ├── SectionStudentsPage.tsx
│   │   │   └── TeacherSchedulePage.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── StudentsManagePage.tsx
│   │   │   ├── TeachersManagePage.tsx
│   │   │   ├── CoursesManagePage.tsx
│   │   │   ├── SemestersManagePage.tsx
│   │   │   ├── SectionsManagePage.tsx
│   │   │   └── AuditLogsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── services/             # Axios / Fetch client and API services
│   │   ├── api.ts            # Axios instance with auth interceptor & refresh token logic
│   │   ├── authService.ts
│   │   ├── studentService.ts
│   │   ├── teacherService.ts
│   │   └── adminService.ts
│   ├── hooks/                # Custom React hooks (useAuth, useTimetable, useDebounce)
│   ├── contexts/             # AuthContext, ThemeContext
│   ├── types/                # TypeScript interface definitions (User, Course, Enrollment, etc.)
│   ├── utils/                # Date helpers, formatters, validation schemas (Zod)
│   ├── routes/               # React Router config with ProtectedRoute & RoleGuard
│   │   ├── AppRoutes.tsx
│   │   └── ProtectedRoute.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css             # Tailwind base & utilities
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```
