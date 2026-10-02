import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  Calendar,
  Activity,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'จัดการผู้ใช้งาน', icon: Users },
    { to: '/admin/courses', label: 'หลักสูตรและรายวิชา', icon: BookOpen },
    { to: '/admin/sections', label: 'เปิดกลุ่มเรียน', icon: Layers },
    { to: '/admin/semesters', label: 'ภาคการศึกษา', icon: Calendar },
    { to: '/admin/audit-logs', label: 'ประวัติการใช้งาน (Audit Logs)', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white tracking-tight block">
                    RegPortal
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    ADMIN CONSOLE
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium block">
                  ระบบบริหารจัดการส่วนกลาง (Central Management)
                </span>
              </div>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-800">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-semibold text-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-white">
                    ผู้ดูแลระบบ (Admin)
                  </p>
                  <p className="text-slate-400 font-mono">
                    {user?.email}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 hover:border-red-400/50 cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-800/80 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
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
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <p>© 2026 ระบบลงทะเบียนนักศึกษา (Student Registration System) • ส่วนผู้ดูแลระบบส่วนกลาง</p>
      </footer>
    </div>
  );
};
