export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type StudentStatus = 'ACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'DROPPED_OUT';

export type SemesterStatus = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'FINISHED';

export type EnrollmentStatus = 'REGISTERED' | 'DROPPED' | 'CANCELLED';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface Department {
  id: string;
  code: string;
  name: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  yearLevel: number;
  status: StudentStatus;
  department: Department;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  teacherCode: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  department: Department;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  student?: StudentProfile;
  teacher?: TeacherProfile;
}

export interface Schedule {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
}

export interface CourseSection {
  id: string;
  sectionNumber: number;
  capacity: number;
  enrolledCount: number;
  remainingSeats: number;
  isFull: boolean;
  room: string;
  teacher: {
    id: string;
    teacherCode: string;
    firstName: string;
    lastName: string;
  };
  schedules: Schedule[];
  isEnrolled: boolean;
  canRegister: boolean;
}

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  description?: string;
  department: Department;
  isAlreadyEnrolled: boolean;
  sections: CourseSection[];
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseSectionId: string;
  semesterId: string;
  status: EnrollmentStatus;
  registeredAt: string;
  courseSection: {
    id: string;
    sectionNumber: number;
    room: string;
    course: {
      id: string;
      courseCode: string;
      courseName: string;
      credits: number;
      department: Department;
    };
    teacher: {
      firstName: string;
      lastName: string;
      teacherCode: string;
    };
    schedules: Schedule[];
  };
}

export interface TimetableSlot {
  enrollmentId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  sectionNumber: number;
  teacherName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
}

export interface StudentDashboardData {
  student: StudentProfile;
  currentSemester: {
    id: string;
    academicYear: number;
    semesterNumber: number;
    registrationStart: string;
    registrationEnd: string;
    status: SemesterStatus;
  } | null;
  stats: {
    enrolledCoursesCount: number;
    totalRegisteredCredits: number;
  };
}

export interface TeacherDashboardData {
  teacher: {
    id: string;
    teacherCode: string;
    firstName: string;
    lastName: string;
    email: string;
    department: Department;
  };
  currentSemester: {
    id: string;
    academicYear: number;
    semesterNumber: number;
    status: SemesterStatus;
  } | null;
  stats: {
    sectionsCount: number;
    studentsCount: number;
    totalCredits: number;
  };
}

export interface TeacherSection {
  id: string;
  sectionNumber: number;
  capacity: number;
  enrolledCount: number;
  remainingSeats: number;
  room: string;
  course: {
    id: string;
    courseCode: string;
    courseName: string;
    credits: number;
    description?: string;
    department: string;
  };
  semester: {
    id: string;
    academicYear: number;
    semesterNumber: number;
    status: SemesterStatus;
  };
  schedules: Schedule[];
}

export interface RosterStudent {
  enrollmentId: string;
  status: EnrollmentStatus;
  registeredAt: string;
  student: {
    id: string;
    studentCode: string;
    firstName: string;
    lastName: string;
    email: string;
    yearLevel: number;
    department: string;
  };
}

export interface TeacherSectionRoster {
  section: {
    id: string;
    sectionNumber: number;
    capacity: number;
    enrolledCount: number;
    remainingSeats: number;
    room: string;
    course: {
      id: string;
      courseCode: string;
      courseName: string;
      credits: number;
      department: string;
    };
    semester: {
      id: string;
      academicYear: number;
      semesterNumber: number;
    };
    schedules: Schedule[];
  };
  students: RosterStudent[];
  stats: {
    totalActive: number;
    totalDropped: number;
    capacity: number;
  };
}

export interface TeacherTimetableSlot {
  sectionId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  sectionNumber: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
  enrolledCount: number;
  capacity: number;
}

export interface AdminDashboardData {
  overview: {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
    totalCourses: number;
    totalDepartments: number;
    activeSections: number;
    activeEnrollments: number;
  };
  currentSemester: {
    id: string;
    academicYear: number;
    semesterNumber: number;
    status: SemesterStatus;
    registrationStart: string;
    registrationEnd: string;
  } | null;
  recentLogs: AdminAuditLog[];
}

export interface AdminUser {
  id: string;
  email: string;
  role: Role;
  phone?: string;
  createdAt: string;
  student?: {
    id: string;
    studentCode: string;
    firstName: string;
    lastName: string;
    yearLevel: number;
    status: StudentStatus;
    department: Department;
  };
  teacher?: {
    id: string;
    teacherCode: string;
    firstName: string;
    lastName: string;
    department: Department;
  };
}

export interface AdminDepartment {
  id: string;
  code: string;
  name: string;
  _count: {
    students: number;
    teachers: number;
    courses: number;
  };
}

export interface AdminCourse {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  description?: string;
  departmentId: string;
  department: Department;
  _count: {
    sections: number;
  };
}

export interface AdminSemester {
  id: string;
  academicYear: number;
  semesterNumber: number;
  registrationStart: string;
  registrationEnd: string;
  startDate: string;
  endDate: string;
  status: SemesterStatus;
  _count: {
    sections: number;
    enrollments: number;
  };
}

export interface AdminSection {
  id: string;
  sectionNumber: number;
  capacity: number;
  enrolledCount: number;
  remainingSeats: number;
  room: string;
  course: Course;
  semester: AdminSemester;
  teacher: {
    id: string;
    teacherCode: string;
    firstName: string;
    lastName: string;
    department: Department;
  };
  schedules: Schedule[];
}

export interface AdminAuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
  user?: {
    email: string;
    role: Role;
  };
}

