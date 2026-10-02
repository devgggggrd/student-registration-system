import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type {
  AdminSection,
  AdminCourse,
  AdminSemester,
  AdminUser,
  DayOfWeek,
} from '../../types';
import {
  Layers,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MONDAY', label: 'วันจันทร์' },
  { key: 'TUESDAY', label: 'วันอังคาร' },
  { key: 'WEDNESDAY', label: 'วันพุธ' },
  { key: 'THURSDAY', label: 'วันพฤหัสบดี' },
  { key: 'FRIDAY', label: 'วันศุกร์' },
  { key: 'SATURDAY', label: 'วันเสาร์' },
  { key: 'SUNDAY', label: 'วันอาทิตย์' },
];

export const AdminSectionsPage: React.FC = () => {
  const [sections, setSections] = useState<AdminSection[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [semesters, setSemesters] = useState<AdminSemester[]>([]);
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    courseId: '',
    semesterId: '',
    sectionNumber: 1,
    teacherId: '',
    capacity: 40,
    room: 'ENG-201',
    dayOfWeek: 'MONDAY' as DayOfWeek,
    startTime: '09:00',
    endTime: '12:00',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [secData, crsData, semData, userData] = await Promise.all([
        adminService.getSections(selectedSemesterId || undefined),
        adminService.getCourses(),
        adminService.getSemesters(),
        adminService.getUsers(undefined, 'TEACHER'),
      ]);
      setSections(secData);
      setCourses(crsData);
      setSemesters(semData);
      setTeachers(userData);

      // default selections
      if (crsData.length > 0 && !formData.courseId) {
        setFormData((prev) => ({ ...prev, courseId: crsData[0].id }));
      }
      if (semData.length > 0 && !formData.semesterId) {
        setFormData((prev) => ({ ...prev, semesterId: semData[0].id }));
      }
      if (userData.length > 0 && userData[0].teacher && !formData.teacherId) {
        setFormData((prev) => ({ ...prev, teacherId: userData[0].teacher!.id }));
      }
    } catch (err) {
      console.error('Failed to load sections data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSemesterId]);

  const handleDeleteSection = async (sectionId: string, courseCode: string, secNum: number) => {
    if (!window.confirm(`ยืนยันการลบกลุ่มเรียน ${courseCode} กลุ่ม ${secNum}?`)) return;

    try {
      await adminService.deleteSection(sectionId);
      setFeedback({ type: 'success', message: `ลบกลุ่มเรียน ${courseCode} กลุ่ม ${secNum} สำเร็จ` });
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'ไม่สามารถลบกลุ่มเรียนได้ (อาจมีนักศึกษาลงทะเบียนอยู่)';
      setFeedback({ type: 'error', message: Array.isArray(msg) ? msg.join(', ') : msg });
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      await adminService.createSection({
        courseId: formData.courseId,
        semesterId: formData.semesterId,
        sectionNumber: formData.sectionNumber,
        teacherId: formData.teacherId,
        capacity: formData.capacity,
        room: formData.room,
        schedules: [
          {
            dayOfWeek: formData.dayOfWeek,
            startTime: formData.startTime,
            endTime: formData.endTime,
            room: formData.room,
          },
        ],
      });

      setFeedback({ type: 'success', message: `เปิดกลุ่มเรียนใหม่สำเร็จ!` });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเปิดกลุ่มเรียน (ตารางอาจชนกับห้องเรียนหรืออาจารย์)';
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
            Course Section Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            จัดการการเปิดกลุ่มเรียน (Sections) มอบหมายอาจารย์ผู้สอน กำหนดห้องเรียน และจัดตารางเวลา
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เปิดกลุ่มเรียนใหม่</span>
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">เลือกภาคการศึกษา:</span>
          <select
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">ภาคการศึกษาปัจจุบัน (Active Semester)</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                Semester {s.semesterNumber}/{s.academicYear} ({s.status})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500">
          ทั้งหมด: <span className="font-bold text-slate-800">{sections.length}</span> กลุ่มเรียน
        </span>
      </div>

      {/* Sections Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-700">ยังไม่มีกลุ่มเรียนที่เปิดสอน</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">รหัสวิชา</th>
                  <th className="px-4 py-3">ชื่อรายวิชา</th>
                  <th className="px-4 py-3 text-center">กลุ่ม (Sec)</th>
                  <th className="px-4 py-3">อาจารย์ผู้สอน</th>
                  <th className="px-4 py-3 text-center">ความจุ / ที่ลงทะเบียน</th>
                  <th className="px-4 py-3">ห้องเรียน</th>
                  <th className="px-4 py-3">วันและเวลาเรียน</th>
                  <th className="px-4 py-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sections.map((sec) => (
                  <tr key={sec.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-amber-700">
                      {sec.course.courseCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {sec.course.courseName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800">
                        Sec {sec.sectionNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {sec.teacher.firstName} {sec.teacher.lastName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-slate-800">
                        {sec.enrolledCount} / {sec.capacity}
                      </span>
                      <span className="text-slate-400 text-[10px] ml-1">
                        (ว่าง {sec.remainingSeats})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {sec.room}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {sec.schedules.map((s) => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteSection(sec.id, sec.course.courseCode, sec.sectionNumber)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบกลุ่มเรียน"
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

      {/* Open Section Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Open New Course Section</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลือกรายวิชา (Course)
                </label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} - {c.courseName} ({c.credits} หน่วยกิต)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ภาคการศึกษา (Semester)
                  </label>
                  <select
                    required
                    value={formData.semesterId}
                    onChange={(e) => setFormData({ ...formData, semesterId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  >
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        Semester {s.semesterNumber}/{s.academicYear} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ตอนเรียน / กลุ่ม (Section No.)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.sectionNumber}
                    onChange={(e) => setFormData({ ...formData, sectionNumber: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อาจารย์ผู้สอน (Instructor)
                </label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                >
                  {teachers.map((t) => (
                    <option key={t.teacher?.id} value={t.teacher?.id}>
                      {t.teacher?.firstName} {t.teacher?.lastName} ({t.teacher?.teacherCode} • {t.teacher?.department.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ความจุที่นั่ง (Capacity)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 40 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ห้องเรียน (Room)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="ENG-301"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Schedule definition */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="block text-xs font-bold text-slate-800">
                  กำหนดวันและเวลาเรียน (Class Schedule)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">วันในสัปดาห์</label>
                    <select
                      value={formData.dayOfWeek}
                      onChange={(e: any) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      {DAYS.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">เวลาเริ่ม</label>
                    <input
                      type="text"
                      required
                      placeholder="09:00"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">เวลาสิ้นสุด</label>
                    <input
                      type="text"
                      required
                      placeholder="12:00"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
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
                  {isSubmitting ? 'กำลังบันทึก...' : 'เปิดกลุ่มเรียน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
