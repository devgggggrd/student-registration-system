import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { AdminCourse, AdminDepartment } from '../../types';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

export const AdminCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    courseCode: '',
    courseName: '',
    credits: 3,
    departmentId: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const [coursesData, deptData] = await Promise.all([
        adminService.getCourses(search, deptFilter),
        adminService.getDepartments(),
      ]);
      setCourses(coursesData);
      setDepartments(deptData);
      if (deptData.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: deptData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [deptFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleDeleteCourse = async (courseId: string, courseCode: string) => {
    if (!window.confirm(`ยืนยันการลบรายวิชา ${courseCode}?`)) return;

    try {
      await adminService.deleteCourse(courseId);
      setFeedback({ type: 'success', message: `ลบรายวิชา ${courseCode} สำเร็จ` });
      fetchCourses();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'ไม่สามารถลบรายวิชาได้ (อาจมีกลุ่มเรียนเปิดสอนอยู่)';
      setFeedback({ type: 'error', message: Array.isArray(msg) ? msg.join(', ') : msg });
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      await adminService.createCourse(formData);
      setFeedback({ type: 'success', message: `สร้างรายวิชา ${formData.courseCode} สำเร็จ!` });
      setIsModalOpen(false);
      setFormData({
        courseCode: '',
        courseName: '',
        credits: 3,
        departmentId: departments[0]?.id || '',
        description: '',
      });
      fetchCourses();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างรายวิชา';
      setFeedback({ type: 'error', message: Array.isArray(msg) ? msg.join(', ') : msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Curriculum & Course Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            จัดการข้อมูลหลักสูตรและรายวิชาที่เปิดสอนในมหาวิทยาลัย
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มรายวิชาใหม่</span>
        </button>
      </div>

      {/* Global Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารหัสวิชา หรือชื่อวิชา..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">ภาควิชาทั้งหมด (All Departments)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-700">ไม่พบรายวิชาที่ค้นหา</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">รหัสวิชา</th>
                  <th className="px-4 py-3">ชื่อรายวิชา</th>
                  <th className="px-4 py-3 text-center">หน่วยกิต</th>
                  <th className="px-4 py-3">ภาควิชาสังกัด</th>
                  <th className="px-4 py-3 text-center">กลุ่มเปิดสอน</th>
                  <th className="px-4 py-3">คำอธิบายรายวิชา</th>
                  <th className="px-4 py-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-amber-700 text-sm">
                      {c.courseCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {c.courseName}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {c.credits} นก.
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.department.name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                        {c._count.sections} กลุ่ม
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {c.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteCourse(c.id, c.courseCode)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบรายวิชา"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Create New Course</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสวิชา (Course Code)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                    placeholder="CS201"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวนหน่วยกิต (Credits)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    required
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value, 10) || 3 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อรายวิชา (Course Name)
                </label>
                <input
                  type="text"
                  required
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  placeholder="Data Structures & Algorithms"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ภาควิชาสังกัด (Department)
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คำอธิบายรายวิชา (Description - ถ้ามี)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="รายละเอียดเนื้อหาในรายวิชา..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายวิชา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
