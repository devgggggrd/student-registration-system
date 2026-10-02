import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight block">
                  RegPortal
                </span>
                <span className="text-xs text-indigo-600 font-medium block">
                  ระบบลงทะเบียนนักศึกษา
                </span>
              </div>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600 font-semibold">
                  {user?.student?.firstName?.[0] || <UserIcon className="w-4 h-4" />}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-slate-800">
                    {user?.student ? `${user.student.firstName} ${user.student.lastName}` : user?.email}
                  </p>
                  <p className="text-slate-500">
                    รหัสนักศึกษา: <span className="font-mono text-slate-700 font-medium">{user?.student?.studentCode || 'N/A'}</span>
                    {user?.student?.department && ` • ${user.student.department.name}`}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200 cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
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
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>© 2026 ระบบลงทะเบียนนักศึกษา (Student Registration System) สงวนลิขสิทธิ์ทั้งหมด</p>
      </footer>
    </div>
  );
};
