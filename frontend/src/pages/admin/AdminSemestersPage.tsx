import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { AdminSemester, SemesterStatus } from '../../types';
import {
  Calendar,
  Plus,
  XCircle,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';

export const AdminSemestersPage: React.FC = () => {
  const [semesters, setSemesters] = useState<AdminSemester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    academicYear: 2026,
    semesterNumber: 2,
    registrationStart: '2026-11-01T08:30:00Z',
    registrationEnd: '2026-11-15T16:30:00Z',
    startDate: '2026-11-20',
    endDate: '2027-03-31',
    status: 'UPCOMING' as SemesterStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSemesters = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getSemesters();
      setSemesters(data);
    } catch (err) {
      console.error('Failed to load semesters', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const handleToggleStatus = async (semesterId: string, currentStatus: SemesterStatus) => {
    const nextStatus: SemesterStatus =
      currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';

    if (
      !window.confirm(
        `คุณต้องการเปลี่ยนสถานะภาคการศึกษานี้เป็น "${nextStatus}" ใช่หรือไม่?${
          nextStatus === 'OPEN' ? ' (ระบบจะปิดรับลงทะเบียนภาคอื่นอัตโนมัติ)' : ''
        }`,
      )
    ) {
      return;
    }

    try {
      await adminService.updateSemesterStatus(semesterId, nextStatus);
      setFeedback({ type: 'success', message: `เปลี่ยนสถานะภาคการศึกษาเป็น ${nextStatus} เรียบร้อยแล้ว` });
      fetchSemesters();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ';
      setFeedback({ type: 'error', message: Array.isArray(msg) ? msg.join(', ') : msg });
    }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      await adminService.createSemester(formData);
      setFeedback({ type: 'success', message: `สร้างภาคการศึกษา ${formData.semesterNumber}/${formData.academicYear} สำเร็จ!` });
      setIsModalOpen(false);
      fetchSemesters();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'ไม่สามารถสร้างภาคการศึกษาได้';
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
            Academic Year & Semester Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            กำหนดปีการศึกษา ภาคเรียน และช่วงวันเวลาเปิด-ปิดรับลงทะเบียนเรียน
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มภาคการศึกษาใหม่</span>
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

      {/* Semesters Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
        </div>
      ) : semesters.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-700">ยังไม่มีข้อมูลภาคการศึกษา</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ปีการศึกษา / ภาคเรียน</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3">ช่วงเวลาเปิดลงทะเบียน</th>
                  <th className="px-4 py-3">ระยะเวลาภาคการศึกษา</th>
                  <th className="px-4 py-3 text-center">กลุ่มเปิดสอน</th>
                  <th className="px-4 py-3 text-center">รายการลงทะเบียน</th>
                  <th className="px-4 py-3 text-center">ปรับสถานะเปิด/ปิด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {semesters.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                      Semester {s.semesterNumber} / {s.academicYear}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.status === 'OPEN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Sparkles className="w-3 h-3" />
                          OPEN (เปิดรับ)
                        </span>
                      ) : s.status === 'CLOSED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          <XCircle className="w-3 h-3" />
                          CLOSED (ปิดรับ)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          {s.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {new Date(s.registrationStart).toLocaleDateString('th-TH')} -{' '}
                      {new Date(s.registrationEnd).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {new Date(s.startDate).toLocaleDateString('th-TH')} -{' '}
                      {new Date(s.endDate).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {s._count.sections} กลุ่ม
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-600">
                      {s._count.enrollments} รายการ
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(s.id, s.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          s.status === 'OPEN'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {s.status === 'OPEN' ? 'ปิดรับลงทะเบียน' : 'เปิดรับลงทะเบียน'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Semester Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Create New Academic Semester</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSemester} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ปีการศึกษา (Academic Year)
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2040}
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: parseInt(e.target.value, 10) || 2026 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ภาคเรียนที่ (Semester No.)
                  </label>
                  <select
                    value={formData.semesterNumber}
                    onChange={(e) => setFormData({ ...formData, semesterNumber: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  >
                    <option value={1}>ภาคเรียนที่ 1</option>
                    <option value={2}>ภาคเรียนที่ 2</option>
                    <option value={3}>ภาคฤดูร้อน (Summer)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันเริ่มเปิดรับลงทะเบียน
                  </label>
                  <input
                    type="datetime-local"
                    required
                    onChange={(e) => setFormData({ ...formData, registrationStart: new Date(e.target.value).toISOString() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันสิ้นสุดการลงทะเบียน
                  </label>
                  <input
                    type="datetime-local"
                    required
                    onChange={(e) => setFormData({ ...formData, registrationEnd: new Date(e.target.value).toISOString() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันเปิดภาคการศึกษา
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันปิดภาคการศึกษา
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานะเริ่มต้น (Status)
                </label>
                <select
                  value={formData.status}
                  onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                >
                  <option value="UPCOMING">UPCOMING (เตรียมเปิด)</option>
                  <option value="OPEN">OPEN (เปิดรับลงทะเบียนทันที)</option>
                  <option value="CLOSED">CLOSED (ปิดรับลงทะเบียน)</option>
                </select>
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
                  {isSubmitting ? 'กำลังบันทึก...' : 'สร้างภาคการศึกษา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
