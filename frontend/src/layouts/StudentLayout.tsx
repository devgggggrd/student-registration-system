import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/common';
import {
  GraduationCap,
  LayoutDashboard,
  Search,
  BookOpen,
  Calendar,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/courses', label: 'ค้นหาและลงทะเบียนวิชา', icon: Search },
    { to: '/student/my-courses', label: 'วิชาที่ลงทะเบียนแล้ว', icon: BookOpen },
    { to: '/student/schedule', label: 'ตารางเรียนประจำสัปดาห์', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Header Navbar */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <GraduationCap className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight block">
                  RegPortal
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium block">
                  ระบบลงทะเบียนนักศึกษา
                </span>
              </div>
            </div>

            {/* User Profile, ThemeToggle & Logout */}
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />

              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-semibold text-xs">
                  {user?.student?.firstName?.[0] || <UserIcon className="w-4 h-4" aria-hidden="true" />}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {user?.student ? `${user.student.firstName} ${user.student.lastName}` : user?.email}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    รหัส: <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{user?.student?.studentCode || 'N/A'}</span>
                    {user?.student?.department && ` • ${user.student.department.name}`}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                aria-label="ออกจากระบบ (Sign Out)"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/50 cursor-pointer min-h-[44px] sm:min-h-fit focus:outline-none focus:ring-2 focus:ring-red-500/50"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <nav aria-label="แถบนำทางหลักของนักศึกษา" className="flex space-x-1 sm:space-x-4 border-t border-slate-100 dark:border-slate-800/80 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap min-h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200/60 dark:border-indigo-800/50'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <p>© 2026 ระบบลงทะเบียนนักศึกษา (Student Registration System) สงวนลิขสิทธิ์ทั้งหมด</p>
      </footer>
    </div>
  );
};
