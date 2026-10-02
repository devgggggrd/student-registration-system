import { api } from './api';
import type {
  AdminDashboardData,
  AdminUser,
  AdminDepartment,
  AdminCourse,
  AdminSemester,
  AdminSection,
  AdminAuditLog,
  SemesterStatus,
} from '../types';

export const adminService = {
  // Dashboard
  async getDashboard(): Promise<AdminDashboardData> {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  // Users
  async getUsers(search?: string, role?: string): Promise<AdminUser[]> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (role) params.role = role;
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  async createUser(data: any): Promise<AdminUser> {
    const res = await api.post('/admin/users', data);
    return res.data;
  },

  async updateUser(userId: string, data: any): Promise<AdminUser> {
    const res = await api.patch(`/admin/users/${userId}`, data);
    return res.data;
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  },

  // Departments
  async getDepartments(): Promise<AdminDepartment[]> {
    const res = await api.get('/admin/departments');
    return res.data;
  },

  async createDepartment(data: { code: string; name: string }): Promise<AdminDepartment> {
    const res = await api.post('/admin/departments', data);
    return res.data;
  },

  // Courses
  async getCourses(search?: string, departmentId?: string): Promise<AdminCourse[]> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (departmentId) params.departmentId = departmentId;
    const res = await api.get('/admin/courses', { params });
    return res.data;
  },

  async createCourse(data: {
    courseCode: string;
    courseName: string;
    credits: number;
    departmentId: string;
    description?: string;
  }): Promise<AdminCourse> {
    const res = await api.post('/admin/courses', data);
    return res.data;
  },

  async deleteCourse(courseId: string): Promise<{ message: string }> {
    const res = await api.delete(`/admin/courses/${courseId}`);
    return res.data;
  },

  // Semesters
  async getSemesters(): Promise<AdminSemester[]> {
    const res = await api.get('/admin/semesters');
    return res.data;
  },

  async createSemester(data: any): Promise<AdminSemester> {
    const res = await api.post('/admin/semesters', data);
    return res.data;
  },

  async updateSemesterStatus(
    semesterId: string,
    status: SemesterStatus,
  ): Promise<AdminSemester> {
    const res = await api.patch(`/admin/semesters/${semesterId}/status`, { status });
    return res.data;
  },

  // Sections
  async getSections(semesterId?: string): Promise<AdminSection[]> {
    const params: Record<string, string> = {};
    if (semesterId) params.semesterId = semesterId;
    const res = await api.get('/admin/sections', { params });
    return res.data;
  },

  async createSection(data: any): Promise<AdminSection> {
    const res = await api.post('/admin/sections', data);
    return res.data;
  },

  async deleteSection(sectionId: string): Promise<{ message: string }> {
    const res = await api.delete(`/admin/sections/${sectionId}`);
    return res.data;
  },

  // Audit Logs
  async getAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
    const res = await api.get('/admin/audit-logs', { params: { limit } });
    return res.data;
  },
};
