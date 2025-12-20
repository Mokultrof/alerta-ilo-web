import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthScreen from '../components/auth/AuthScreen';
import Dashboard from '../components/Dashboard';
import MapScreen from '../components/map/MapScreen';
import ProfileScreen from '../components/profile/ProfileScreen';
import NotFound from '../components/NotFound';
import LoadingScreen from '../components/LoadingScreen';
import ModernLayout from '../components/layout/ModernLayout';

// Componente para rutas protegidas
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Componente para rutas públicas (solo para usuarios no autenticados)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Componente principal del router
const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raíz - redirige según el estado de autenticación */}
        <Route
          path="/"
          element={<RootRedirect />}
        />

        {/* Rutas públicas (solo para usuarios no autenticados) */}
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthScreen />
            </PublicRoute>
          }
        />

        {/* Rutas protegidas (solo para usuarios autenticados) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ModernLayout>
                <Dashboard />
              </ModernLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <ModernLayout>
                <MapScreen />
              </ModernLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ModernLayout>
                <ProfileScreen />
              </ModernLayout>
            </ProtectedRoute>
          }
        />

        {/* Ruta catch-all para páginas no encontradas */}
        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </BrowserRouter>
  );
};

// Componente para manejar la redirección desde la ruta raíz
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/auth" replace />;
  }
};

export default AppRouter;