# API Documentation — Student Registration System

## Overview
- **Base URL**: `http://localhost:3000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:3000/api/docs`
- **Authentication**: JWT Bearer Token passed via HTTP Header: `Authorization: Bearer <accessToken>`
- **Response Format**: `application/json`

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### `POST /auth/login`
Authenticates a user and issues an access token.
- **Request Body**:
  ```json
  {
    "email": "student1@reg.edu",
    "password": "Password@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "cm1student001",
      "email": "student1@reg.edu",
      "role": "STUDENT",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
  ```

### `GET /auth/me`
Retrieves current authenticated profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "id": "cm1student001",
    "email": "student1@reg.edu",
    "role": "STUDENT",
    "student": {
      "id": "std001",
      "studentCode": "6601001",
      "status": "ACTIVE"
    }
  }
  ```

---

## 2. Student Endpoints (`/api/v1/student`)
*Requires `STUDENT` role.*

### `GET /student/courses`
Search and filter open course catalog.
- **Query Parameters**:
  - `search` (optional): Keyword search on code or title
  - `departmentId` (optional): Filter by department UUID
- **Response (200 OK)**:
  ```json
  {
    "semester": {
      "id": "sem001",
      "academicYear": 2026,
      "semesterNumber": 1,
      "isRegistrationOpen": true
    },
    "courses": [
      {
        "id": "course001",
        "courseCode": "CS101",
        "title": "Intro to Computer Science",
        "credits": 3,
        "sections": [
          {
            "id": "sec001",
            "sectionNumber": 1,
            "capacity": 30,
            "enrolledCount": 18,
            "teacher": { "user": { "firstName": "Alan", "lastName": "Turing" } },
            "schedules": [
              { "dayOfWeek": "MON", "startTime": "09:00", "endTime": "12:00", "room": "LAB 101" }
            ]
          }
        ]
      }
    ]
  }
  ```

### `POST /student/enrollments`
Register for a course section.
- **Request Body**:
  ```json
  {
    "sectionId": "sec001"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "enr001",
    "status": "REGISTERED",
    "courseSection": {
      "sectionNumber": 1,
      "course": { "courseCode": "CS101", "title": "Intro to Computer Science" }
    }
  }
  ```

### `DELETE /student/enrollments/:id`
Drop a registered course (IDOR protected: only student's own enrollment).
- **Response (200 OK)**:
  ```json
  {
    "message": "Successfully dropped enrollment",
    "id": "enr001"
  }
  ```

### `GET /student/enrollments`
List all enrollments for current active semester.

### `GET /student/schedule`
Get structured timetable matrix with weekday slots.

---

## 3. Faculty / Teacher Endpoints (`/api/v1/teacher`)
*Requires `TEACHER` role.*

### `GET /teacher/dashboard`
Faculty summary statistics (total sections, total enrolled students, next lecture).

### `GET /teacher/sections`
List all sections assigned to the instructor.

### `GET /teacher/sections/:id/roster`
List student roster for a section (BOLA protected: teacher must own the section).
- **Response (200 OK)**:
  ```json
  {
    "section": {
      "id": "sec001",
      "sectionNumber": 1,
      "capacity": 30,
      "course": { "courseCode": "CS101", "title": "Intro to Computer Science" }
    },
    "students": [
      {
        "student": {
          "id": "std001",
          "studentCode": "6601001",
          "user": { "firstName": "John", "lastName": "Doe", "email": "student1@reg.edu" }
        },
        "status": "REGISTERED",
        "createdAt": "2026-10-01T08:00:00.000Z"
      }
    ]
  }
  ```

### `GET /teacher/schedule`
Faculty teaching weekly timetable.

---

## 4. Academic Administrator Endpoints (`/api/v1/admin`)
*Requires `ADMIN` role.*

### `GET /admin/dashboard`
University-wide metrics (cached for 3s): active students, active courses, total enrollments, active semester.

### `GET /admin/users` & `POST /admin/users`
Manage user accounts with full profile parameters (`firstName`, `lastName`, `email`, `phone`, `role`, `departmentId`, `studentCode`, etc.).

### `PATCH /admin/users/:id`
Update user information including password resetting, email, name, phone, department, or student status.

### `GET /admin/courses` & `POST /admin/courses`
Curriculum course catalog management.

### `GET /admin/sections` & `POST /admin/sections`
Course section scheduling with collision detection and capacity limits.

### `GET /admin/semesters` & `POST /admin/semesters`
Academic calendar and registration period toggle (`isRegistrationOpen`).

### `GET /admin/audit-logs`
Security compliance and audit trails inspection.

---

## 5. Health Check (`/api/v1/health`)
- **GET /health**:
  ```json
  {
    "status": "ok",
    "uptime": 234.12,
    "timestamp": "2026-10-02T10:37:42.467Z"
  }
  ```
