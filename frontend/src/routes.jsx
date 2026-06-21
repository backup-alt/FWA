import { LazyRoutes } from './LazyRoutes';

export const routes = [
  {
    path: '/login',
    element: <LazyRoutes.LoginPage />,
    public: true,
  },
  {
    path: '/',
    element: <LazyRoutes.DashboardPage />,
  },
  {
    path: '/add-customer',
    element: <LazyRoutes.AddClientPage />,
  },
  {
    path: '/customers',
    element: <LazyRoutes.CustomersPage />,
  },
  {
    path: '/customer/:id',
    element: <LazyRoutes.CustomerDetailPage />,
  },
  {
    path: '/customer/:customerId/add-loan',
    element: <LazyRoutes.AddClientPage />,
  },
  {
    path: '/loan/:id',
    element: <LazyRoutes.LoanDetailPage />,
  },
  {
    path: '/pending-dues',
    element: <LazyRoutes.PendingDuesPage />,
  },
  {
    path: '/report',
    element: <LazyRoutes.ReportPage />,
  },
];
