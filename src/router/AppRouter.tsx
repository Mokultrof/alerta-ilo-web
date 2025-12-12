import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// import { ReportsProvider } from '../contexts/ReportsContext'; // Eliminado - SpotShare no usa reportes
import AuthScreen from '../components/auth/AuthScreen';
import Dashboard from '../components/Dashboard';
import MapScreen from '../components/map/MapScreen';
import ProfileScreen from '../components/profile/ProfileScreen';
import LoadingScreen from '../components/LoadingScreen';
import Layout from '../components/layout/Layout';

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
              <Layout showNavigation={false}>
                <AuthScreen />
              </Layout>
            </PublicRoute>
          } 
        />

        {/* Rutas protegidas (solo para usuarios autenticados) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/map" 
          element={
            <ProtectedRoute>
              <Layout>
                <MapScreen />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <ProfileScreen />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Ruta catch-all para páginas no encontradas */}
        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
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