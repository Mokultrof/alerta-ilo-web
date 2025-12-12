import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AccessibilityButton from '../accessibility/AccessibilityButton';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import { KeyboardNavigation } from '../../utils/accessibility';
import { useTranslation } from '../../hooks/useTranslation';
import './Navigation.css';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string, labelKey: string) => {
    navigate(path);
    // Announce navigation to screen readers
    const _label = t(labelKey);
    setTimeout(() => {
      const element = document.querySelector('h1, h2, [role="main"]') as HTMLElement;
      if (element) {
        element.focus();
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    KeyboardNavigation.handleButtonKeyDown(e, action);
  };

  if (!user) {
    return null;
  }

  return (
    <nav 
      className="main-navigation"
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="nav-brand">
        <h2>
          <span className="decorative-icon" aria-hidden="true">🚨</span>
          {t('app.name')}
        </h2>
      </div>

      <div className="nav-links" role="menubar">
        <button 
          className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => handleNavigation('/dashboard', 'navigation.home')}
          onKeyDown={(e) => handleKeyDown(e, () => handleNavigation('/dashboard', 'navigation.home'))}
          aria-current={isActive('/dashboard') ? 'page' : undefined}
          aria-label={t('navigation.home')}
          role="menuitem"
        >
          <span className="decorative-icon" aria-hidden="true">🏠</span>
          <span className="icon-text">{t('navigation.home')}</span>
        </button>
        
        <button 
          className={`nav-link ${isActive('/map') ? 'active' : ''}`}
          onClick={() => handleNavigation('/map', 'navigation.map')}
          onKeyDown={(e) => handleKeyDown(e, () => handleNavigation('/map', 'navigation.map'))}
          aria-current={isActive('/map') ? 'page' : undefined}
          aria-label={t('navigation.map')}
          role="menuitem"
        >
          <span className="decorative-icon" aria-hidden="true">🗺️</span>
          <span className="icon-text">{t('navigation.map')}</span>
        </button>
        
        <button 
          className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
          onClick={() => handleNavigation('/profile', 'navigation.profile')}
          onKeyDown={(e) => handleKeyDown(e, () => handleNavigation('/profile', 'navigation.profile'))}
          aria-current={isActive('/profile') ? 'page' : undefined}
          aria-label={t('navigation.profile')}
          role="menuitem"
        >
          <span className="decorative-icon" aria-hidden="true">👤</span>
          <span className="icon-text">{t('navigation.profile')}</span>
        </button>
      </div>

      <div className="nav-user">
        <div className="user-info">
          <div className="user-avatar">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={t('profile.title')}
              />
            ) : (
              <div 
                className="avatar-placeholder"
                aria-label={t('profile.title')}
                role="img"
              >
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <span className="user-name" aria-label={`${t('profile.title')}: ${user.displayName}`}>
            {user.displayName}
          </span>
        </div>
        
        <LanguageSwitcher compact />
        
        <AccessibilityButton />
        
        <button 
          className="sign-out-btn"
          onClick={handleSignOut}
          onKeyDown={(e) => handleKeyDown(e, handleSignOut)}
          aria-label={t('navigation.signOut')}
        >
          <span className="decorative-icon" aria-hidden="true">🚪</span>
          <span className="icon-text">{t('navigation.signOut')}</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;