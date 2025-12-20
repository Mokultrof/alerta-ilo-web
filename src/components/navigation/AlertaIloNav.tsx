/**
 * AlertaIloNav - Navegación principal de Alerta Ilo
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';
import NotificationBell from '../ui/NotificationBell';
import './AlertaIloNav.css';

const AlertaIloNav: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const [imageError, setImageError] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [user?.photoURL]);

  const handleSignOut = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    setShowLogoutConfirm(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
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
            {/* Theme Toggle Button */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Notification Bell */}
            <NotificationBell />

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

      {/* Modal de confirmación de cierre de sesión */}
      {showLogoutConfirm && (
        <div className="logout-confirm-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-confirm-icon">👋</div>
            <h3>¿Cerrar sesión?</h3>
            <p>¿Estás seguro de que deseas salir de tu cuenta?</p>
            <div className="logout-confirm-actions">
              <button className="logout-btn cancel" onClick={() => setShowLogoutConfirm(false)}>
                Cancelar
              </button>
              <button className="logout-btn confirm" onClick={confirmSignOut}>
                Sí, cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertaIloNav;