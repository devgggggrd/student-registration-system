import { api } from './api';
import type {
  TeacherDashboardData,
  TeacherSection,
  TeacherSectionRoster,
  TeacherTimetableSlot,
} from '../types';

export const teacherService = {
  async getProfile(): Promise<TeacherDashboardData> {
    const res = await api.get('/teacher/profile');
    return res.data;
  },

  async getSections(semesterId?: string): Promise<TeacherSection[]> {
    const params: Record<string, string> = {};
    if (semesterId) params.semesterId = semesterId;
    const res = await api.get('/teacher/sections', { params });
    return res.data;
  },

  async getSectionRoster(sectionId: string): Promise<TeacherSectionRoster> {
    const res = await api.get(`/teacher/sections/${sectionId}/roster`);
    return res.data;
  },

  async getSchedule(): Promise<{
    semester: { id: string; academicYear: number; semesterNumber: number } | null;
    slots: TeacherTimetableSlot[];
  }> {
    const res = await api.get('/teacher/schedule');
    return res.data;
  },
};
