import { api } from './api';
import type {
  StudentDashboardData,
  Course,
  Enrollment,
  TimetableSlot,
} from '../types';

export const studentService = {
  async getProfile(): Promise<StudentDashboardData> {
    const res = await api.get('/student/profile');
    return res.data;
  },

  async searchCourses(search?: string, departmentId?: string): Promise<{
    semester: any;
    courses: Course[];
  }> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (departmentId) params.departmentId = departmentId;
    const res = await api.get('/student/courses', { params });
    return res.data;
  },

  async getEnrollments(): Promise<Enrollment[]> {
    const res = await api.get('/student/enrollments');
    return res.data;
  },

  async enrollCourse(courseSectionId: string): Promise<{
    message: string;
    enrollment: Enrollment;
  }> {
    const res = await api.post('/student/enrollments', { courseSectionId });
    return res.data;
  },

  async dropCourse(enrollmentId: string): Promise<{
    message: string;
  }> {
    const res = await api.delete(`/student/enrollments/${enrollmentId}`);
    return res.data;
  },

  async getSchedule(): Promise<{
    semester: { academicYear: number; semesterNumber: number };
    slots: TimetableSlot[];
  }> {
    const res = await api.get('/student/schedule');
    return res.data;
  },
};
