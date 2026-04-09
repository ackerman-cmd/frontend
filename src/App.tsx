import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { ToolOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAuth } from './shared/hooks/useAuth';
import { useStorageSync } from './shared/hooks/useStorageSync';
import AppLayout from './app/layout/AppLayout';

const LoginPage           = React.lazy(() => import('./pages/LoginPage/LoginPage'));
const RegisterPage        = React.lazy(() => import('./pages/RegisterPage/RegisterPage'));
const AuthCallbackPage    = React.lazy(() => import('./pages/AuthCallbackPage/AuthCallbackPage'));
const VerifyEmailPage     = React.lazy(() => import('./pages/VerifyEmailPage/VerifyEmailPage'));
const ProfilePage         = React.lazy(() => import('./pages/ProfilePage/ProfilePage'));
const AppealsPage          = React.lazy(() => import('./pages/AppealsPage/AppealsPage'));
const AppealDetailPage     = React.lazy(() => import('./pages/AppealDetailPage/AppealDetailPage'));
const OrganizationsPage    = React.lazy(() => import('./pages/OrganizationsPage/OrganizationsPage'));
const AssignmentGroupsPage = React.lazy(() => import('./pages/AssignmentGroupsPage/AssignmentGroupsPage'));
const SkillGroupsPage      = React.lazy(() => import('./pages/SkillGroupsPage/SkillGroupsPage'));
const AppealTopicsPage     = React.lazy(() => import('./pages/AppealTopicsPage/AppealTopicsPage'));
const AdminUsersPage       = React.lazy(() => import('./pages/AdminUsersPage/AdminUsersPage'));

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

const PageLoader = () => (
  <div style={{
    minHeight: '100vh', background: '#F5F5F5',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20,
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: 12,
      background: '#FFDD2D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, fontWeight: 900, color: '#1A1A1A',
    }}>AS</div>
    <Spin indicator={<LoadingOutlined style={{ fontSize: 28, color: '#1A1A1A' }} spin />} />
  </div>
);

const WipPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh', animation: 'fadeInUp 0.3s ease both',
  }}>
    <div style={{
      background: 'var(--white)', border: '1.5px solid var(--gray-200)',
      borderRadius: 'var(--radius-lg)', padding: '56px 48px',
      textAlign: 'center', position: 'relative', overflow: 'hidden',
      maxWidth: 480, width: '100%',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'var(--yellow)',
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--yellow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
        }}>
          <ToolOutlined style={{ color: 'var(--black)' }} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--black)', margin: 0, letterSpacing: -0.5 }}>
          {title}
        </h1>
        <p style={{
          fontSize: 15, color: 'var(--gray-500)', margin: 0,
          background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)',
          borderRadius: 'var(--radius-sm)', padding: '10px 20px',
        }}>
          🚧 Страница в разработке
        </p>
      </div>
    </div>
  </div>
);

function AppRoot() {
  useStorageSync();

  return (
    <React.Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/register"     element={<RegisterPage />} />
        <Route path="/callback"     element={<AuthCallbackPage />} />
        <Route path="/auth/verify"  element={<VerifyEmailPage />} />

        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index                        element={<Navigate to="/appeals" replace />} />
          <Route path="profile"               element={<ProfilePage />} />
          <Route path="appeals"               element={<AppealsPage />} />
          <Route path="appeals/:id"           element={<AppealDetailPage />} />
          <Route path="organizations"         element={<AdminRoute><OrganizationsPage /></AdminRoute>} />
          <Route path="assignment-groups"     element={<AdminRoute><AssignmentGroupsPage /></AdminRoute>} />
          <Route path="skill-groups"          element={<AdminRoute><SkillGroupsPage /></AdminRoute>} />
          <Route path="appeal-topics"         element={<AdminRoute><AppealTopicsPage /></AdminRoute>} />
          <Route path="admin/users"           element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="admin/users/:id"       element={<AdminRoute><WipPage title="Детали пользователя" /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
}

export default AppRoot;
