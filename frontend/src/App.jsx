import { Routes, Route, Navigate } from 'react-router-dom';
import { routes } from './routes';
import { Layout } from '@/components/layout/Layout';

function AppRoutes() {
  return (
    <Routes>
      {routes.map((route, index) => (
        <Route
          key={index}
          path={route.path}
          element={
            route.public
              ? route.element
              : (
                <Layout>
                  {route.element}
                </Layout>
              )
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
