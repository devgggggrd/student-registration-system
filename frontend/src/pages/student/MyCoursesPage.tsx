import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import type { Enrollment } from '../../types';
import {
  BookOpen,
  User,
  Clock,
  MapPin,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react';

const DAY_TH: Record<string, string> = {
  MONDAY: 'วันจันทร์',
  TUESDAY: 'วันอังคาร',
  WEDNESDAY: 'วันพุธ',
  THURSDAY: 'วันพฤหัสบดี',
  FRIDAY: 'วันศุกร์',
  SATURDAY: 'วันเสาร์',
  SUNDAY: 'วันอาทิตย์',
};

export const MyCoursesPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [droppingId, setDroppingId] = useState<string | null>(null);
  const [confirmDropItem, setConfirmDropItem] = useState<Enrollment | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchEnrollments = async () => {
    try {
      setIsLoading(true);
      const data = await studentService.getEnrollments();
      setEnrollments(data);
    } catch {
      setFeedback({ type: 'error', message: 'ไม่สามารถดึงข้อมูลรายวิชาที่ลงทะเบียนได้' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleConfirmDrop = async () => {
    if (!confirmDropItem) return;
    setDroppingId(confirmDropItem.id);
    setFeedback(null);

    try {
      const res = await studentService.dropCourse(confirmDropItem.id);
      setFeedback({
        type: 'success',
        message: res.message || 'ถอนรายวิชาเรียบร้อยแล้ว',
      });
      setConfirmDropItem(null);
      await fetchEnrollments();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'การถอนรายวิชาล้มเหลว';
      setFeedback({
        type: 'error',
        message: Array.isArray(msg) ? msg.join(', ') : msg,
      });
    } finally {
      setDroppingId(null);
    }
  };

  const activeEnrollments = enrollments.filter((e) => e.status === 'REGISTERED');
  const droppedEnrollments = enrollments.filter((e) => e.status === 'DROPPED');
  const totalCredits = activeEnrollments.reduce(
    (sum, e) => sum + e.courseSection.course.credits,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header & Total Credits Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Enrolled Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            ตรวจสอบรายวิชาที่ลงทะเบียนแล้ว เวลาเรียน และจัดการการถอนรายวิชา
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-right shadow-sm transition-colors">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">หน่วยกิตรวมที่ลงทะเบียน</span>
            <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
              {totalCredits} <span className="text-xs font-normal text-slate-400">หน่วยกิต</span>
            </span>
          </div>

          <Link
            to="/student/courses"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            <span>เพิ่มรายวิชา</span>
          </Link>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs sm:text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-850 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-850 text-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            aria-label="ปิดการแจ้งเตือน"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg"
          >
            <XCircle className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Active Enrollments Table */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            รายวิชาที่กำลังศึกษา ({activeEnrollments.length} วิชา)
          </h2>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">ภาคการศึกษา 2026/1</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : activeEnrollments.length === 0 ? (
          <div className="text-center py-12 px-4">
            <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">ยังไม่มีรายวิชาที่ลงทะเบียนในภาคการศึกษานี้</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              คุณยังไม่ได้ลงทะเบียนรายวิชาใดๆ สามารถค้นหาและเพิ่มรายวิชาได้ทันที
            </p>
            <Link
              to="/student/courses"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              <span>ค้นหารายวิชาที่เปิดสอน</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-5 py-3.5">รายวิชา</th>
                  <th scope="col" className="px-4 py-3.5">กลุ่มเรียนและอาจารย์</th>
                  <th scope="col" className="px-4 py-3.5">วัน-เวลาเรียน</th>
                  <th scope="col" className="px-4 py-3.5">หน่วยกิต</th>
                  <th scope="col" className="px-4 py-3.5">สถานะ</th>
                  <th scope="col" className="px-5 py-3.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeEnrollments.map((enr) => {
                  const sec = enr.courseSection;
                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded text-xs border border-indigo-200/50 dark:border-indigo-800/50">
                            {sec.course.courseCode}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {sec.course.courseName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {sec.course.department.name}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">กลุ่ม {sec.sectionNumber}</span>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          <User className="w-3 h-3 text-slate-400" aria-hidden="true" />
                          <span>
                            {sec.teacher.firstName} {sec.teacher.lastName}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-xs">
                        <div className="space-y-1">
                          {sec.schedules.map((sch) => (
                            <div key={sch.id} className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                              <Clock className="w-3 h-3 text-slate-400" aria-hidden="true" />
                              <span>
                                {DAY_TH[sch.dayOfWeek] || sch.dayOfWeek} {sch.startTime} - {sch.endTime}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-400" aria-hidden="true" />
                            <span>ห้องเรียน: {sec.room}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-mono font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                        {sec.course.credits}
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md text-[11px] font-semibold">
                          ลงทะเบียนสำเร็จ
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setConfirmDropItem(enr)}
                          aria-label={`ถอนรายวิชา ${sec.course.courseCode}`}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/60 cursor-pointer min-h-[36px] focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          title="ถอนรายวิชา"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>ถอนวิชา</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dropped Courses Section (if any) */}
      {droppedEnrollments.length > 0 && (
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 transition-colors">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            รายวิชาที่ถอนแล้วในภาคการศึกษานี้ ({droppedEnrollments.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {droppedEnrollments.map((enr) => (
              <div key={enr.id} className="py-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 dark:text-slate-500">
                    {enr.courseSection.course.courseCode}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{enr.courseSection.course.courseName}</span>
                  <span className="text-[11px] text-slate-400">
                    (กลุ่ม {enr.courseSection.sectionNumber})
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[11px]">
                  ถอนแล้ว
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDropItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-drop-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>

            <h3 id="confirm-drop-title" className="text-base font-bold text-slate-900 dark:text-white">
              ยืนยันการถอนรายวิชา
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการถอนวิชา{' '}
              <strong className="text-slate-900 dark:text-white font-bold">
                {confirmDropItem.courseSection.course.courseCode}{' '}
                {confirmDropItem.courseSection.course.courseName}
              </strong>{' '}
              (กลุ่ม {confirmDropItem.courseSection.sectionNumber})?
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              ที่นั่งที่จองไว้จะถูกคืนให้กับระบบทันทีเพื่อให้เพื่อนนักศึกษาท่านอื่นสามารถลงทะเบียนได้
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDropItem(null)}
                disabled={droppingId !== null}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirmDrop}
                disabled={droppingId !== null}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-60 flex items-center gap-1.5 cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                {droppingId !== null ? (
                  <span>กำลังดำเนินการ...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>ยืนยันถอนวิชา</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
