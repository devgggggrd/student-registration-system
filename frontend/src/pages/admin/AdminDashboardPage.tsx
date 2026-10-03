import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { AdminDashboardData } from '../../types';
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);


  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const res = await adminService.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load admin dashboard', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();

    // SSE Stream
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE_URL}/admin/audit-logs/stream?token=${encodeURIComponent(token)}`);
      eventSource.onopen = () => setIsLive(true);
      eventSource.onmessage = (event) => {
        try {
          const newLog = JSON.parse(event.data);
          if (newLog && newLog.id) {
            setData((prev) => {
              if (!prev) return prev;
              const exists = prev.recentLogs.some((l) => l.id === newLog.id);
              if (exists) return prev;
              return {
                ...prev,
                recentLogs: [newLog, ...prev.recentLogs.slice(0, 4)],
              };
            });
            // Background refresh stats
            adminService.getDashboard().then((res) => setData(res)).catch(() => {});
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };
      eventSource.onerror = () => setIsLive(false);
    } catch {
      setIsLive(false);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!data) return null;

  const { overview, currentSemester, recentLogs } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              System Administrator
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ระบบทำงานปกติ (Online)</span>
            </span>
            {isLive && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>REAL-TIME STREAMING</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Admin Control Center
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            ศูนย์กลางการกำกับดูแลและบริหารจัดการระบบลงทะเบียนนักศึกษา ผู้ใช้งาน รายวิชา และตารางเรียน
          </p>
        </div>

        {/* Current Semester Badge Card */}
        {currentSemester && (
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl p-4 shrink-0 text-right md:text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>ภาคการศึกษาที่เปิดรับ</span>
            </div>
            <p className="text-xl font-bold mt-0.5 text-white">
              Semester {currentSemester.semesterNumber}/{currentSemester.academicYear}
            </p>
            <div className="mt-1 flex items-center justify-end gap-1 text-xs text-emerald-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>สถานะ: {currentSemester.status}</span>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              นักศึกษาทั้งหมด
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {overview.totalStudents} <span className="text-xs font-normal text-slate-400">คน</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              อาจารย์ผู้สอน
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {overview.totalTeachers} <span className="text-xs font-normal text-slate-400">ท่าน</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              รายวิชาในหลักสูตร
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {overview.totalCourses} <span className="text-xs font-normal text-slate-400">วิชา</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ภาควิชาทั้งหมด
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {overview.totalDepartments} <span className="text-xs font-normal text-slate-400">ภาควิชา</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              กลุ่มเรียนเปิดสอน
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {overview.activeSections} <span className="text-xs font-normal text-slate-400">กลุ่ม (Sec)</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              การลงทะเบียนเรียน
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {overview.activeEnrollments} <span className="text-xs font-normal text-slate-400">รายการ</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ผู้ดูแลระบบ
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {overview.totalAdmins} <span className="text-xs font-normal text-slate-400">บัญชี</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-100 dark:border-cyan-900/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              สถานะเซิร์ฟเวอร์
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              100% <span className="text-xs font-normal text-slate-400">พร้อมใช้งาน</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Management Hub & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Management Hub */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-colors">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Administration Modules</h2>
            <div className="space-y-3">
              <Link
                to="/admin/users"
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-500/50 rounded-xl transition-all group cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                    <Users className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-900 dark:group-hover:text-amber-300">
                      จัดการผู้ใช้งาน (Users)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">เพิ่ม/ลบ บัญชีนักศึกษาและอาจารย์</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-400" aria-hidden="true" />
              </Link>

              <Link
                to="/admin/courses"
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-500/50 rounded-xl transition-all group cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-900 dark:group-hover:text-amber-300">
                      หลักสูตรและรายวิชา (Courses)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">จัดการข้อมูลรายวิชาและหน่วยกิต</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-400" aria-hidden="true" />
              </Link>

              <Link
                to="/admin/sections"
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-500/50 rounded-xl transition-all group cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <Layers className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-900 dark:group-hover:text-amber-300">
                      เปิดกลุ่มเรียน (Course Sections)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">มอบหมายอาจารย์และห้องเรียน</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-400" aria-hidden="true" />
              </Link>

              <Link
                to="/admin/semesters"
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-500/50 rounded-xl transition-all group cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-900 dark:group-hover:text-amber-300">
                      ภาคการศึกษา (Semesters)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">เปิด-ปิด ช่วงเวลาลงทะเบียน</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-400" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Recent Audit Logs Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent System Audit Logs</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ประวัติเหตุการณ์สำคัญในระบบที่มีการบันทึกไว้ล่าสุด
              </p>
            </div>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 min-h-[32px] px-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <span>ดูประวัติทั้งหมด</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5">เวลาบันทึก</th>
                  <th scope="col" className="px-3.5 py-2.5">การกระทำ (Action)</th>
                  <th scope="col" className="px-3.5 py-2.5">เป้าหมาย (Entity)</th>
                  <th scope="col" className="px-3.5 py-2.5">ผู้ใช้งาน</th>
                  <th scope="col" className="px-3.5 py-2.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentLogs && recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 font-medium">
                        {log.entity}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {log.user?.email || 'System'}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                      ยังไม่มีบันทึกประวัติเหตุการณ์
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
