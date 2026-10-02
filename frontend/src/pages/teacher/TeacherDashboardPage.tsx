import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import type { TeacherDashboardData, TeacherSection } from '../../types';
import {
  BookOpen,
  Users,
  Award,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const TeacherDashboardPage: React.FC = () => {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [sections, setSections] = useState<TeacherSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashData, sectionsList] = await Promise.all([
          teacherService.getProfile(),
          teacherService.getSections(),
        ]);
        setData(dashData);
        setSections(sectionsList);
      } catch (err: any) {
        setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดอาจารย์ได้');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <span>{error || 'ไม่พบข้อมูลอาจารย์'}</span>
      </div>
    );
  }

  const { teacher, currentSemester, stats } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
              Teacher Portal
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
              ● สถานะปกติ (Active)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, Prof. {teacher.firstName} {teacher.lastName}!
          </h1>
          <p className="text-purple-100 text-sm mt-1 max-w-xl">
            {teacher.department.name} • รหัสอาจารย์:{' '}
            <span className="font-mono font-bold text-white">{teacher.teacherCode}</span>
          </p>
        </div>

        {/* Current Semester Card */}
        {currentSemester && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shrink-0 text-right md:text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs text-purple-200">
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
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              กลุ่มเรียนที่สอน
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats.sectionsCount} <span className="text-xs font-normal text-slate-400">กลุ่ม (Sec)</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              นักศึกษาในความรับผิดชอบ
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats.studentsCount} <span className="text-xs font-normal text-slate-400">คน</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ภาระงานสอนรวม
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats.totalCredits} <span className="text-xs font-normal text-slate-400">หน่วยกิต</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              สถานะอาจารย์
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              ปฏิบัติการสอน <span className="text-xs font-normal text-emerald-600 font-semibold">(ปกติ)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Sections List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">My Active Sections</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                รายวิชาและกลุ่มเรียนที่รับผิดชอบการสอนในภาคการศึกษานี้
              </p>
            </div>
            <Link
              to="/teacher/courses"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <span>จัดการกลุ่มเรียนทั้งหมด</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">ไม่มีกลุ่มเรียนที่รับผิดชอบ</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                ยังไม่มีข้อมูลรายวิชาที่ได้รับมอบหมายการสอนในภาคการศึกษาปัจจุบัน
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sections.map((sec) => {
                const percent = Math.round((sec.enrolledCount / sec.capacity) * 100);
                return (
                  <div key={sec.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 font-bold text-purple-700 text-xs flex flex-col items-center justify-center shrink-0">
                        <span>Sec</span>
                        <span className="text-sm leading-none">{sec.sectionNumber}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {sec.course.courseCode}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-md">
                            {sec.course.credits} หน่วยกิต
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">
                          {sec.course.courseName}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {sec.schedules.map((s) => `${s.dayOfWeek} ${s.startTime}-${s.endTime}`).join(', ') || 'ออนไลน์'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            ห้อง {sec.room}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800">
                          {sec.enrolledCount} / {sec.capacity} คน
                        </span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent >= 100 ? 'bg-red-500' : percent >= 80 ? 'bg-amber-500' : 'bg-purple-600'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      </div>

                      <Link
                        to={`/teacher/courses?sectionId=${sec.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>รายชื่อนักศึกษา</span>
                      </Link>
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
                to="/teacher/courses"
                className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
                      รายวิชาและรายชื่อนักศึกษา
                    </p>
                    <p className="text-[11px] text-slate-500">ตรวจสอบรายชื่อผู้ลงทะเบียนแต่ละตอน</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
              </Link>

              <Link
                to="/teacher/schedule"
                className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                      ตารางสอนประจำสัปดาห์
                    </p>
                    <p className="text-[11px] text-slate-500">ดูคาบการสอนและห้องบรรยาย</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </Link>
            </div>
          </div>

          {/* Teacher Guide Notice */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900">
            <div className="flex items-center gap-2 font-bold mb-1">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>คำแนะนำสำหรับอาจารย์ผู้สอน</span>
            </div>
            <p className="text-purple-700 leading-relaxed">
              อาจารย์สามารถตรวจสอบรายชื่อนักศึกษาที่ลงทะเบียนในแต่ละกลุ่มเรียน และสามารถพิมพ์รายงานรายชื่อ (Student Roster) เพื่อนำไปใช้เช็คชื่อและจัดการเรียนการสอนได้ทันที
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
