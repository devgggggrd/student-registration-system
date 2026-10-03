import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../../components/common';
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'STUDENT') {
        navigate('/student');
      } else if (user.role === 'TEACHER') {
        navigate('/teacher');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือรหัสผ่าน');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 transition-colors duration-200 relative">
      {/* Top Right Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full">
        {/* Card Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-3">
            <GraduationCap className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Student Registration Portal
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            เข้าสู่ระบบเพื่อจัดการรายวิชา การลงทะเบียนเรียน และตรวจสอบตารางเรียน
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800 p-7 transition-colors">
          {error && (
            <div role="alert" className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{Array.isArray(error) ? error.join(', ') : error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                อีเมลผู้ใช้งาน (Email Address)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student1@reg.edu"
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[44px] mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {isLoading ? (
                <span>กำลังเข้าสู่ระบบ...</span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              <span>เลือกบัญชีทดสอบด่วน (คลิกเพื่อเลือก):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('student1@reg.edu', 'Password@123')}
                className="text-left p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-slate-600 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">นักศึกษา: John Doe</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">รหัส 6601001 (CS ปี 2)</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('student2@reg.edu', 'Password@123')}
                className="text-left p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-slate-600 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">นักศึกษา: Jane Smith</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">รหัส 6601002 (CS ปี 2)</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('teacher1@reg.edu', 'Password@123')}
                className="text-left p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:border-emerald-200 dark:hover:border-slate-600 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">อาจารย์: Alan Turing</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">รหัส T001 (CS)</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('admin@reg.edu', 'Admin@1234')}
                className="text-left p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-slate-800 hover:border-purple-200 dark:hover:border-slate-600 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">ผู้ดูแลระบบ (Admin)</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">สำนักทะเบียนฯ</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
