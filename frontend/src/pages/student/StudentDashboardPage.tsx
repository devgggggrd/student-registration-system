import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import type { StudentDashboardData, Enrollment } from '../../types';
import {
  BookOpen,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashData, enrolledList] = await Promise.all([
          studentService.getProfile(),
          studentService.getEnrollments(),
        ]);
        setData(dashData);
        setEnrollments(enrolledList.filter((e) => e.status === 'REGISTERED'));
      } catch (err: any) {
        setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <span>{error || 'ไม่พบข้อมูลนักศึกษา'}</span>
      </div>
    );
  }

  const { student, currentSemester, stats } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
              Student Portal
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
              ● สถานะปกติ (Active)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {student.firstName} {student.lastName}!
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            {student.department.name} • ชั้นปีที่ {student.yearLevel} • รหัสนักศึกษา:{' '}
            <span className="font-mono font-bold text-white">{student.studentCode}</span>
          </p>
        </div>

        {/* Current Semester Card */}
        {currentSemester && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shrink-0 text-right md:text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs text-indigo-200">
              <Calendar className="w-4 h-4" />
              <span>ภาคการศึกษาปัจจุบัน</span>
            </div>
            <p className="text-xl font-bold mt-0.5">
              Semester {currentSemester.semesterNumber}/{currentSemester.academicYear}
            </p>
            <div className="mt-1 flex items-center justify-end gap-1 text-xs text-emerald-300 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>สถานะ: เปิดรับลงทะเบียน</span>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              วิชาที่ลงทะเบียน
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats.enrolledCoursesCount} <span className="text-xs font-normal text-slate-400">รายวิชา</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              หน่วยกิตสะสมในเทอม
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats.totalRegisteredCredits} <span className="text-xs font-normal text-slate-400">/ 22 สูงสุด</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              สถานภาพการศึกษา
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              ปกติ <span className="text-xs font-normal text-emerald-600 font-semibold">(เรียบร้อย)</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ระบบลงทะเบียน
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              เปิดอยู่ <span className="text-xs font-normal text-slate-400">(ลงทะเบียนได้)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Enrolled Courses List Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Current Enrolled Courses</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                รายวิชาที่ลงทะเบียนสำเร็จในภาคการศึกษาปัจจุบัน
              </p>
            </div>
            <Link
              to="/student/my-courses"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>จัดการรายวิชา</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">ยังไม่มีรายวิชาที่ลงทะเบียน</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                ค้นหารายวิชาที่เปิดสอนและลงทะเบียนเรียนก่อนสิ้นสุดกำหนดการ
              </p>
              <Link
                to="/student/courses"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหารายวิชาเพื่อลงทะเบียน</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {enrollments.map((enr) => {
                const sec = enr.courseSection;
                return (
                  <div key={enr.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-700 text-xs flex items-center justify-center shrink-0">
                        {sec.course.credits} นก.
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {sec.course.courseCode}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-md">
                            กลุ่ม {sec.sectionNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{sec.course.courseName}</p>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <p className="font-medium text-slate-700">
                        {sec.schedules.map((s) => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`).join(', ') || 'ออนไลน์ / รอประกาศ'}
                      </p>
                      <p className="text-slate-400 mt-0.5">ห้องเรียน: {sec.room}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Action Hub */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-2.5">
              <Link
                to="/student/courses"
                className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                      ค้นหาและลงทะเบียนวิชา
                    </p>
                    <p className="text-[11px] text-slate-500">ตรวจสอบกลุ่มเรียนและที่นั่งว่าง</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </Link>

              <Link
                to="/student/schedule"
                className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                      ตารางเรียนรายสัปดาห์
                    </p>
                    <p className="text-[11px] text-slate-500">ดูคาบเรียนและห้องเรียน</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </Link>
            </div>
          </div>

          {/* Registration Notice Box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
            <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>ประกาศสำคัญเกี่ยวกับการลงทะเบียน</span>
            </div>
            <p className="text-amber-700 leading-relaxed">
              การลงทะเบียนและการถอนรายวิชาจะปิดรับตามกำหนดเวลาของมหาวิทยาลัย กรุณาตรวจสอบไม่ให้เวลาเรียนซ้อนทับกัน และหน่วยกิตรวมไม่เกินเกณฑ์ที่กำหนด
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
