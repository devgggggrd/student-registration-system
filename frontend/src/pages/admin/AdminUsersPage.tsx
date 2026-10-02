import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { AdminUser, AdminDepartment, Role, StudentStatus } from '../../types';
import {
  Users,
  Search,
  UserPlus,
  Trash2,
  Pencil,
  X,
  CheckCircle2,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    password: '',
    phone: '',
    role: 'STUDENT' as Role,
    firstName: '',
    lastName: '',
    studentCode: '',
    teacherCode: '',
    departmentId: '',
    yearLevel: 1,
  });

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    email: '',
    password: '',
    phone: '',
    firstName: '',
    lastName: '',
    studentCode: '',
    teacherCode: '',
    departmentId: '',
    yearLevel: 1,
    studentStatus: 'ACTIVE' as StudentStatus,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const [usersData, deptData] = await Promise.all([
        adminService.getUsers(search, roleFilter),
        adminService.getDepartments(),
      ]);
      setUsers(usersData);
      setDepartments(deptData);
      if (deptData.length > 0 && !createFormData.departmentId) {
        setCreateFormData((prev) => ({ ...prev, departmentId: deptData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 350);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้ ${email}?`)) return;

    try {
      await adminService.deleteUser(userId);
      setFeedback({ type: 'success', message: `ลบบัญชีผู้ใช้ ${email} เรียบร้อยแล้ว` });
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'ไม่สามารถลบบัญชีผู้ใช้ได้';
      setFeedback({ type: 'error', message: Array.isArray(msg) ? msg.join(', ') : msg });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      await adminService.createUser(createFormData);
      setFeedback({ type: 'success', message: `สร้างบัญชีผู้ใช้ ${createFormData.email} สำเร็จ!` });
      setIsCreateModalOpen(false);
      setCreateFormData({
        email: '',
        password: '',
        phone: '',
        role: 'STUDENT',
        firstName: '',
        lastName: '',
        studentCode: '',
        teacherCode: '',
        departmentId: departments[0]?.id || '',
        yearLevel: 1,
      });
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างบัญชี';
      setFeedback({ type: 'error', message: Array.isArray(msg) ? msg.join(', ') : msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email,
      password: '',
      phone: user.phone || '',
      firstName: user.student?.firstName || user.teacher?.firstName || '',
      lastName: user.student?.lastName || user.teacher?.lastName || '',
      studentCode: user.student?.studentCode || '',
      teacherCode: user.teacher?.teacherCode || '',
      departmentId: user.student?.department?.id || user.teacher?.department?.id || departments[0]?.id || '',
      yearLevel: user.student?.yearLevel || 1,
      studentStatus: user.student?.status || 'ACTIVE',
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        email: editFormData.email,
        phone: editFormData.phone,
      };

      if (editFormData.password && editFormData.password.trim() !== '') {
        payload.password = editFormData.password;
      }

      if (editingUser.role === 'STUDENT') {
        payload.firstName = editFormData.firstName;
        payload.lastName = editFormData.lastName;
        payload.studentCode = editFormData.studentCode;
        payload.departmentId = editFormData.departmentId;
        payload.yearLevel = editFormData.yearLevel;
        payload.studentStatus = editFormData.studentStatus;
      } else if (editingUser.role === 'TEACHER') {
        payload.firstName = editFormData.firstName;
        payload.lastName = editFormData.lastName;
        payload.teacherCode = editFormData.teacherCode;
        payload.departmentId = editFormData.departmentId;
      }

      await adminService.updateUser(editingUser.id, payload);
      setFeedback({ type: 'success', message: `อัปเดตข้อมูลผู้ใช้งาน ${editFormData.email} สำเร็จ!` });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้งาน';
      setFeedback({ type: 'error', message: Array.isArray(msg) ? msg.join(', ') : msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            User Account Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            จัดการบัญชีผู้ใช้งานระบบทั้งหมด (รหัสผ่าน, อีเมล, เบอร์โทรศัพท์, ชื่อ-สกุล, สาขาวิชา, ชั้นปี และสถานะ)
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>เพิ่มผู้ใช้งานใหม่</span>
        </button>
      </div>

      {/* Global Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยอีเมล, รหัสนักศึกษา, ชื่อ-นามสกุล..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800 transition-all"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">บทบาททั้งหมด (All Roles)</option>
            <option value="STUDENT">นักศึกษา (Student)</option>
            <option value="TEACHER">อาจารย์ (Teacher)</option>
            <option value="ADMIN">ผู้ดูแลระบบ (Admin)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-700">ไม่พบบัญชีผู้ใช้งานที่ค้นหา</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3 text-center w-10">#</th>
                  <th className="px-3.5 py-3">อีเมลผู้ใช้งาน</th>
                  <th className="px-3.5 py-3 text-center">บทบาท</th>
                  <th className="px-3.5 py-3">เบอร์โทรศัพท์</th>
                  <th className="px-3.5 py-3">รหัส / ชื่อ-นามสกุล</th>
                  <th className="px-3.5 py-3">ภาควิชาสังกัด</th>
                  <th className="px-3.5 py-3 text-center">สถานะ</th>
                  <th className="px-3.5 py-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u, idx) => {
                  let roleBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                      {u.role}
                    </span>
                  );
                  if (u.role === 'ADMIN') {
                    roleBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        ADMIN
                      </span>
                    );
                  } else if (u.role === 'TEACHER') {
                    roleBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        TEACHER
                      </span>
                    );
                  } else if (u.role === 'STUDENT') {
                    roleBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        STUDENT
                      </span>
                    );
                  }

                  const nameDisplay = u.student
                    ? `${u.student.firstName} ${u.student.lastName} (ปี ${u.student.yearLevel})`
                    : u.teacher
                    ? `อ. ${u.teacher.firstName} ${u.teacher.lastName}`
                    : 'System Administrator';

                  const codeDisplay = u.student?.studentCode || u.teacher?.teacherCode || '-';
                  const deptDisplay = u.student?.department?.name || u.teacher?.department?.name || 'ส่วนกลาง';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="px-3.5 py-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-3.5 py-3 font-mono font-medium text-slate-900">
                        {u.email}
                      </td>
                      <td className="px-3.5 py-3 text-center">{roleBadge}</td>
                      <td className="px-3.5 py-3 font-mono text-slate-600">
                        {u.phone || <span className="text-slate-300 italic">ไม่ระบุ</span>}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="font-mono font-bold text-slate-800 mr-1.5">
                          {codeDisplay !== '-' && `[${codeDisplay}]`}
                        </span>
                        <span className="text-slate-700">{nameDisplay}</span>
                      </td>
                      <td className="px-3.5 py-3 text-slate-600">{deptDisplay}</td>
                      <td className="px-3.5 py-3 text-center">
                        {u.student?.status === 'ACTIVE' || !u.student ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            ปกติ
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold text-[11px]">
                            {u.student?.status}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลผู้ใช้"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบบัญชีผู้ใช้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Create New User Account</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    บทบาทผู้ใช้งาน (Role)
                  </label>
                  <select
                    value={createFormData.role}
                    onChange={(e: any) => setCreateFormData({ ...createFormData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  >
                    <option value="STUDENT">นักศึกษา (Student)</option>
                    <option value="TEACHER">อาจารย์ผู้สอน (Teacher)</option>
                    <option value="ADMIN">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อีเมล (Email)
                  </label>
                  <input
                    type="email"
                    required
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    placeholder="user@reg.edu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสผ่าน (Password)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ (Phone)
                  </label>
                  <input
                    type="tel"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    placeholder="081-234-5678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>
              </div>

              {createFormData.role !== 'ADMIN' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ชื่อ (First Name)
                      </label>
                      <input
                        type="text"
                        required
                        value={createFormData.firstName}
                        onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                        placeholder="สมชาย"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        นามสกุล (Last Name)
                      </label>
                      <input
                        type="text"
                        required
                        value={createFormData.lastName}
                        onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                        placeholder="ใจดี"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {createFormData.role === 'STUDENT' ? 'รหัสนักศึกษา (Code)' : 'รหัสอาจารย์ (Code)'}
                      </label>
                      <input
                        type="text"
                        required
                        value={createFormData.role === 'STUDENT' ? createFormData.studentCode : createFormData.teacherCode}
                        onChange={(e) =>
                          createFormData.role === 'STUDENT'
                            ? setCreateFormData({ ...createFormData, studentCode: e.target.value })
                            : setCreateFormData({ ...createFormData, teacherCode: e.target.value })
                        }
                        placeholder={createFormData.role === 'STUDENT' ? '6601099' : 'T099'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ภาควิชา (Department)
                      </label>
                      <select
                        value={createFormData.departmentId}
                        onChange={(e) => setCreateFormData({ ...createFormData, departmentId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {createFormData.role === 'STUDENT' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ชั้นปีที่ (Year Level)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={createFormData.yearLevel}
                        onChange={(e) => setCreateFormData({ ...createFormData, yearLevel: parseInt(e.target.value, 10) || 1 })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกผู้ใช้งาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900">Edit User Account</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  แก้ไขข้อมูลผู้ใช้งาน [{editingUser.role}] - {editingUser.email}
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อีเมล (Email)
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ (Phone)
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="081-234-5678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่านใหม่ (New Password - เว้นว่างหากไม่ต้องการเปลี่ยน)
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  placeholder="เว้นว่างถ้าใช้รหัสผ่านเดิม"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                />
              </div>

              {editingUser.role !== 'ADMIN' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ชื่อ (First Name)
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.firstName}
                        onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        นามสกุล (Last Name)
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.lastName}
                        onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {editingUser.role === 'STUDENT' ? 'รหัสนักศึกษา (Code)' : 'รหัสอาจารย์ (Code)'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editingUser.role === 'STUDENT' ? editFormData.studentCode : editFormData.teacherCode}
                        onChange={(e) =>
                          editingUser.role === 'STUDENT'
                            ? setEditFormData({ ...editFormData, studentCode: e.target.value })
                            : setEditFormData({ ...editFormData, teacherCode: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ภาควิชาสังกัด (Department)
                      </label>
                      <select
                        value={editFormData.departmentId}
                        onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {editingUser.role === 'STUDENT' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          ชั้นปีที่ (Year Level)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={editFormData.yearLevel}
                          onChange={(e) => setEditFormData({ ...editFormData, yearLevel: parseInt(e.target.value, 10) || 1 })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          สถานภาพนักศึกษา (Status)
                        </label>
                        <select
                          value={editFormData.studentStatus}
                          onChange={(e: any) => setEditFormData({ ...editFormData, studentStatus: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
                        >
                          <option value="ACTIVE">ACTIVE (ปกติ)</option>
                          <option value="SUSPENDED">SUSPENDED (พักการเรียน)</option>
                          <option value="GRADUATED">GRADUATED (สำเร็จการศึกษา)</option>
                          <option value="DROPPED_OUT">DROPPED_OUT (พ้นสภาพ)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
