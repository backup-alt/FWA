import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AddClientPage = lazy(() => import('./pages/AddClientPage').then(m => ({ default: m.AddClientPage })));
const ClientsPage = lazy(() => import('./pages/ClientsPage').then(m => ({ default: m.ClientsPage })));
const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })));
const PendingDuesPage = lazy(() => import('./pages/PendingDuesPage').then(m => ({ default: m.PendingDuesPage })));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
}

export const LazyRoutes = {
  LoginPage: () => <Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense>,
  DashboardPage: () => (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense>
    </ProtectedRoute>
  ),
  AddClientPage: () => (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}><AddClientPage /></Suspense>
    </ProtectedRoute>
  ),
  ClientsPage: () => (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}><ClientsPage /></Suspense>
    </ProtectedRoute>
  ),
  ClientDetailPage: () => (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}><ClientDetailPage /></Suspense>
    </ProtectedRoute>
  ),
  PendingDuesPage: () => (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}><PendingDuesPage /></Suspense>
    </ProtectedRoute>
  ),
};
