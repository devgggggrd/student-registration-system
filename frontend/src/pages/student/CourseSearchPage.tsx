import React, { useEffect, useState } from 'react';
import { studentService } from '../../services/studentService';
import type { Course } from '../../types';
import {
  Search,
  BookOpen,
  User,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  XCircle,
  Sparkles,
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

export const CourseSearchPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.searchCourses(searchTerm, departmentFilter);
      setCourses(res.courses);
    } catch {
      setFeedback({ type: 'error', message: 'ไม่สามารถดึงข้อมูลรายวิชาได้' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCourses();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, departmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCourses();
  };

  const handleRegister = async (sectionId: string, courseCode: string, secNumber: number) => {
    setFeedback(null);
    setActionLoadingId(sectionId);

    try {
      const res = await studentService.enrollCourse(sectionId);
      setFeedback({
        type: 'success',
        message: res.message || `ลงทะเบียนเรียนสำเร็จ: ${courseCode} กลุ่ม ${secNumber}!`,
      });
      await loadCourses();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'การลงทะเบียนไม่สำเร็จ กรุณาตรวจสอบตารางเรียนชนกันหรือที่นั่งเต็ม';
      setFeedback({
        type: 'error',
        message: Array.isArray(msg) ? msg.join(', ') : msg,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Course Catalog & Registration
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          ค้นหารายวิชาที่เปิดสอนในภาคการศึกษาปัจจุบัน ตรวจสอบจำนวนที่นั่งว่าง ตารางเรียน และกดลงทะเบียนได้ทันที
        </p>
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

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 transition-colors">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
          <label htmlFor="course-search-input" className="sr-only">
            ค้นหาด้วยรหัสวิชาหรือชื่อวิชา
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
          <input
            id="course-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาด้วยรหัสวิชาหรือชื่อวิชา (เช่น CS101, Programming, Database)..."
            className="w-full min-h-[44px] pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 min-h-[36px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            ค้นหา
          </button>
        </form>

        <div className="relative shrink-0">
          <label htmlFor="department-filter" className="sr-only">
            กรองตามภาควิชา
          </label>
          <select
            id="department-filter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full sm:w-auto min-h-[44px] appearance-none pl-3.5 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">ทุกภาควิชา (All Departments)</option>
            <option value="CS">ภาควิชาวิทยาการคอมพิวเตอร์ (CS)</option>
            <option value="SE">ภาควิชาวิศวกรรมซอฟต์แวร์ (SE)</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3.5 pointer-events-none" aria-hidden="true" />
        </div>
      </div>

      {/* Courses List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" aria-hidden="true" />
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">ไม่พบรายวิชาที่ค้นหา</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ลองปรับเปลี่ยนคำค้นหาหรือเลือกดูทุกภาควิชา
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
            >
              {/* Course Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50">
                <div className="flex items-start sm:items-center gap-3">
                  <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
                    {course.courseCode}
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {course.courseName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {course.department.name} • {course.credits} หน่วยกิต
                    </p>
                  </div>
                </div>

                {course.isAlreadyEnrolled && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-semibold shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>ลงทะเบียนวิชานี้แล้ว</span>
                  </span>
                )}
              </div>

              {course.description && (
                <div className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  {course.description}
                </div>
              )}

              {/* Sections Table */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {course.sections.map((section) => {
                  const percentSeats = Math.round((section.enrolledCount / section.capacity) * 100);

                  return (
                    <div
                      key={section.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Section Info & Instructor */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            กลุ่มเรียน (Section) {section.sectionNumber}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-600">|</span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                            {section.teacher.firstName} {section.teacher.lastName}
                          </span>
                        </div>

                        {/* Schedules & Room */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {section.schedules.map((sch) => (
                            <span
                              key={sch.id}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-md border border-slate-200 dark:border-slate-700"
                            >
                              <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                              {DAY_TH[sch.dayOfWeek] || sch.dayOfWeek} {sch.startTime} - {sch.endTime}
                            </span>
                          ))}
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                            <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                            ห้องเรียน: {section.room}
                          </span>
                        </div>
                      </div>

                      {/* Capacity Bar & Action Button */}
                      <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                        {/* Capacity meter */}
                        <div className="text-right">
                          <div className="flex items-center justify-between md:justify-end gap-2 text-xs font-medium mb-1">
                            <span className="text-slate-500 dark:text-slate-400">จำนวนที่นั่ง:</span>
                            <span
                              className={`font-mono font-bold ${
                                section.isFull ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {section.enrolledCount} / {section.capacity}
                            </span>
                          </div>
                          <div className="w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                section.isFull ? 'bg-red-500' : percentSeats > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${percentSeats}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                            {section.isFull ? 'ที่นั่งเต็มแล้ว' : `ว่างอีก ${section.remainingSeats} ที่นั่ง`}
                          </span>
                        </div>

                        {/* Action Button */}
                        <div>
                          {section.isEnrolled ? (
                            <button
                              disabled
                              className="min-h-[44px] px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl cursor-default flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>ลงทะเบียนแล้ว</span>
                            </button>
                          ) : section.isFull ? (
                            <button
                              disabled
                              className="min-h-[44px] px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed"
                            >
                              ที่นั่งเต็ม
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleRegister(section.id, course.courseCode, section.sectionNumber)
                              }
                              disabled={actionLoadingId === section.id || course.isAlreadyEnrolled}
                              className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                              {actionLoadingId === section.id ? (
                                <span className="animate-pulse">กำลังบันทึก...</span>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>ลงทะเบียน</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
