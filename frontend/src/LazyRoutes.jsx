import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AddClientPage = lazy(() => import('./pages/AddClientPage').then(m => ({ default: m.AddClientPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage').then(m => ({ default: m.CustomerDetailPage })));
const LoanDetailPage = lazy(() => import('./pages/LoanDetailPage').then(m => ({ default: m.LoanDetailPage })));
const PendingDuesPage = lazy(() => import('./pages/PendingDuesPage').then(m => ({ default: m.PendingDuesPage })));
const ReportPage = lazy(() => import('./pages/ReportPage').then(m => ({ default: m.ReportPage })));

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
      <Suspense fallback={<LoadingFallback />}><CustomersPage /></Suspense>
    </ProtectedRoute>
  ),
  CustomersPage: () => (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}><CustomersPage /></Suspense>
    </ProtectedRoute>
  ),
  CustomerDetailPage: () => (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}><CustomerDetailPage /></Suspense>
    </ProtectedRoute>
  ),
  LoanDetailPage: () => (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}><LoanDetailPage /></Suspense>
    </ProtectedRoute>
  ),
  PendingDuesPage: () => (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}><PendingDuesPage /></Suspense>
    </ProtectedRoute>
  ),
  ReportPage: () => (
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}><ReportPage /></Suspense>
    </ProtectedRoute>
  ),
};
