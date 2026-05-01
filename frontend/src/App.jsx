import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import useStore from './store/useStore';
import Layout from './components/common/Layout';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import TasksPage from './pages/TasksPage';
import Profile from './pages/Profile';
import LoadingScreen from './components/common/LoadingScreen';

function PrivateRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function AppContent() {
  const { initTheme } = useStore();
  useEffect(() => { initTheme(); }, [initTheme]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-color, #111)',
            border: '1px solid var(--toast-border, #e5e7eb)',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.07)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
