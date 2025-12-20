import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import './ModernSidebar.css';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: number;
}

const ModernSidebar: React.FC = () => {
    const { user, signOut } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const { unreadCount } = useNotifications();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Guardar preferencia en localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved) setIsCollapsed(saved === 'true');
    }, []);

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    }, [isCollapsed]);

    const navItems: NavItem[] = [
        {
            id: 'home',
            label: 'Inicio',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12.5 3.247a1 1 0 00-1 0L4 7.577V20h4.5v-6a1 1 0 011-1h5a1 1 0 011 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 013 0l7.5 4.33a2 2 0 011 1.732V21a1 1 0 01-1 1h-6.5a1 1 0 01-1-1v-6h-3v6a1 1 0 01-1 1H3a1 1 0 01-1-1V7.577a2 2 0 011-1.732l7.5-4.33z" />
                </svg>
            ),
            path: '/dashboard'
        },
        {
            id: 'map',
            label: 'Explorar Mapa',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
            ),
            path: '/map'
        },
        {
            id: 'profile',
            label: 'Mi Perfil',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
            ),
            path: '/profile'
        },
        {
            id: 'notifications',
            label: 'Notificaciones',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
            ),
            path: '/notifications',
            badge: unreadCount
        }
    ];

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

    return (
        <>
            <aside className={`modern-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                {/* Logo y toggle */}
                <div className="sidebar-header">
                    <Link to="/dashboard" className="sidebar-logo">
                        <div className="logo-icon">🚨</div>
                        {!isCollapsed && <span className="logo-text">Alerta Ilo</span>}
                    </Link>
                    <button
                        className="toggle-btn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            {isCollapsed ? (
                                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                            ) : (
                                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Navegación principal */}
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        {!isCollapsed && <span className="nav-section-title">MENÚ</span>}
                        <ul className="nav-list">
                            {navItems.map((item) => (
                                <li key={item.id}>
                                    <Link
                                        to={item.path}
                                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <span className="nav-icon">{item.icon}</span>
                                        {!isCollapsed && <span className="nav-label">{item.label}</span>}
                                        {item.badge && item.badge > 0 && (
                                            <span className="nav-badge">{item.badge > 9 ? '9+' : item.badge}</span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Crear nuevo */}
                    <div className="nav-section">
                        {!isCollapsed && <span className="nav-section-title">CREAR</span>}
                        <ul className="nav-list">
                            <li>
                                <Link to="/map?action=report" className="nav-item create-btn">
                                    <span className="nav-icon">
                                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                        </svg>
                                    </span>
                                    {!isCollapsed && <span className="nav-label">Nuevo Reporte</span>}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* Perfil de usuario */}
                <div className="sidebar-footer">
                    <div className="user-section">
                        <Link to="/profile" className="user-card">
                            <div className="user-avatar">
                                {user?.photoURL && !imageError ? (
                                    <img
                                        src={user.photoURL}
                                        alt="Avatar"
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <span className="status-dot"></span>
                            </div>
                            {!isCollapsed && (
                                <div className="user-info">
                                    <span className="user-name">{user?.displayName || 'Usuario'}</span>
                                    <span className="user-email">{user?.email}</span>
                                </div>
                            )}
                        </Link>

                        <div className="user-actions">
                            <button
                                className="action-btn"
                                onClick={toggleTheme}
                                title={isDark ? 'Modo claro' : 'Modo oscuro'}
                            >
                                {isDark ? '☀️' : '🌙'}
                            </button>
                            <button
                                className="action-btn logout"
                                onClick={handleSignOut}
                                title="Cerrar sesión"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Modal de confirmación de logout */}
            {showLogoutConfirm && (
                <div className="logout-overlay" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="logout-icon">👋</div>
                        <h3>¿Cerrar sesión?</h3>
                        <p>¿Estás seguro de que deseas salir?</p>
                        <div className="logout-actions">
                            <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>
                                Cancelar
                            </button>
                            <button className="btn-confirm" onClick={confirmSignOut}>
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ModernSidebar;
