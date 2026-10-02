import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StudentLayout } from '../layouts/StudentLayout';
import { TeacherLayout } from '../layouts/TeacherLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Lazy-loaded page components for route-level code splitting & performance optimization
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const StudentDashboardPage = lazy(() => import('../pages/student/StudentDashboardPage').then((m) => ({ default: m.StudentDashboardPage })));
const CourseSearchPage = lazy(() => import('../pages/student/CourseSearchPage').then((m) => ({ default: m.CourseSearchPage })));
const MyCoursesPage = lazy(() => import('../pages/student/MyCoursesPage').then((m) => ({ default: m.MyCoursesPage })));
const StudentSchedulePage = lazy(() => import('../pages/student/StudentSchedulePage').then((m) => ({ default: m.StudentSchedulePage })));
const TeacherDashboardPage = lazy(() => import('../pages/teacher/TeacherDashboardPage').then((m) => ({ default: m.TeacherDashboardPage })));
const TeacherCoursesPage = lazy(() => import('../pages/teacher/TeacherCoursesPage').then((m) => ({ default: m.TeacherCoursesPage })));
const TeacherSchedulePage = lazy(() => import('../pages/teacher/TeacherSchedulePage').then((m) => ({ default: m.TeacherSchedulePage })));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminCoursesPage = lazy(() => import('../pages/admin/AdminCoursesPage').then((m) => ({ default: m.AdminCoursesPage })));
const AdminSectionsPage = lazy(() => import('../pages/admin/AdminSectionsPage').then((m) => ({ default: m.AdminSectionsPage })));
const AdminSemestersPage = lazy(() => import('../pages/admin/AdminSemestersPage').then((m) => ({ default: m.AdminSemestersPage })));
const AdminAuditLogsPage = lazy(() => import('../pages/admin/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage })));

const RouteLoadingSpinner: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="flex flex-col items-center space-y-3">
      <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-medium text-slate-500">กำลังโหลด...</span>
    </div>
  </div>
);

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not matching role, redirect according to current role
    if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/student" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Suspense fallback={<RouteLoadingSpinner />}>
      <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated && user ? (
            <Navigate to={user.role === 'STUDENT' ? '/student' : user.role === 'TEACHER' ? '/teacher' : '/admin'} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboardPage />} />
        <Route path="courses" element={<CourseSearchPage />} />
        <Route path="my-courses" element={<MyCoursesPage />} />
        <Route path="schedule" element={<StudentSchedulePage />} />
      </Route>

      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboardPage />} />
        <Route path="courses" element={<TeacherCoursesPage />} />
        <Route path="schedule" element={<TeacherSchedulePage />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="sections" element={<AdminSectionsPage />} />
        <Route path="semesters" element={<AdminSemestersPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* Default Catch-all */}
      <Route
        path="*"
        element={
          isLoading ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : isAuthenticated && user ? (
            <Navigate to={user.role === 'STUDENT' ? '/student' : user.role === 'TEACHER' ? '/teacher' : '/admin'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
    </Suspense>
  );
};
