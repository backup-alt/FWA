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
    path: '/add-client',
    element: <LazyRoutes.AddClientPage />,
  },
  {
    path: '/clients',
    element: <LazyRoutes.ClientsPage />,
  },
  {
    path: '/client/:id',
    element: <LazyRoutes.ClientDetailPage />,
  },
  {
    path: '/pending-dues',
    element: <LazyRoutes.PendingDuesPage />,
  },
];
