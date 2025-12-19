/**
 * AlertaIloNav - Navegación principal de Alerta Ilo
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import './AlertaIloNav.css';

const AlertaIloNav: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [user?.photoURL]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="alerta-ilo-nav">
      <div className="alerta-ilo-nav__container">
        <div className="alerta-ilo-nav__brand">
          <Link to="/dashboard" className="alerta-ilo-nav__brand-link">
            <h1 className="alerta-ilo-nav__title">🚨 Alerta Ilo</h1>
            <span className="alerta-ilo-nav__tagline">Reportes Comunitarios</span>
          </Link>
        </div>

        <div className="alerta-ilo-nav__menu">
          <Link
            to="/dashboard"
            className={`alerta-ilo-nav__link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-icon">🏠</span>
            <span>Inicio</span>
          </Link>

          <Link
            to="/map"
            className={`alerta-ilo-nav__link ${isActive('/map') ? 'active' : ''}`}
          >
            <span className="nav-icon">🗺️</span>
            <span>Mapa</span>
          </Link>

          <Link
            to="/profile"
            className={`alerta-ilo-nav__link ${isActive('/profile') ? 'active' : ''}`}
          >
            <span className="nav-icon">👤</span>
            <span>Perfil</span>
          </Link>
        </div>

        <div className="alerta-ilo-nav__user">
          <div className="alerta-ilo-nav__user-info">
            <div className="alerta-ilo-nav__avatar">
              {user?.photoURL && !imageError ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="alerta-ilo-nav__avatar-placeholder">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="alerta-ilo-nav__user-details">
              <span className="alerta-ilo-nav__username">{user?.displayName || 'Usuario'}</span>
              <span className="alerta-ilo-nav__email">{user?.email}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            }
          >
            Salir
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default AlertaIloNav;