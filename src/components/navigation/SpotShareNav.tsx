/**
 * SpotShareNav - Navegación principal de SpotShare
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import './SpotShareNav.css';

const SpotShareNav: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <nav className="spotshare-nav">
      <div className="spotshare-nav__container">
        <div className="spotshare-nav__brand">
          <h1 className="spotshare-nav__title gradient-text">SpotShare</h1>
          <span className="spotshare-nav__tagline">Comparte tu mundo</span>
        </div>

        <div className="spotshare-nav__user">
          <div className="spotshare-nav__user-info">
            <div className="spotshare-nav__avatar">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} />
              ) : (
                <div className="spotshare-nav__avatar-placeholder">
                  {user?.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="spotshare-nav__user-details">
              <span className="spotshare-nav__username">{user?.displayName}</span>
              <span className="spotshare-nav__email">{user?.email}</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
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

export default SpotShareNav;