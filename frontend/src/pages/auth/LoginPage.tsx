import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Student Registration Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เข้าสู่ระบบเพื่อจัดการรายวิชา การลงทะเบียนเรียน และตรวจสอบตารางเรียน
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-7">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{Array.isArray(error) ? error.join(', ') : error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                อีเมลผู้ใช้งาน (Email Address)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student1@reg.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-300 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>กำลังเข้าสู่ระบบ...</span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>เลือกบัญชีทดสอบด่วน (คลิกเพื่อเข้าสู่ระบบ):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('student1@reg.edu', 'Password@123')}
                className="text-left p-2.5 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-800">นักศึกษา: John Doe</p>
                <p className="text-[11px] text-slate-500">รหัส 6601001 (CS ปี 2)</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('student2@reg.edu', 'Password@123')}
                className="text-left p-2.5 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-800">นักศึกษา: Jane Smith</p>
                <p className="text-[11px] text-slate-500">รหัส 6601002 (CS ปี 2)</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('teacher1@reg.edu', 'Password@123')}
                className="text-left p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-800">อาจารย์: Alan Turing</p>
                <p className="text-[11px] text-slate-500">รหัส T001 (Computer Science)</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('admin@reg.edu', 'Admin@1234')}
                className="text-left p-2.5 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-800">ผู้ดูแลระบบ (Admin)</p>
                <p className="text-[11px] text-slate-500">สำนักทะเบียนและประมวลผล</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
