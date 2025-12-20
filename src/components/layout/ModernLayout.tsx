import React, { useState } from 'react';
import ModernSidebar from './ModernSidebar';
import './ModernLayout.css';

interface ModernLayoutProps {
    children: React.ReactNode;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ children }) => {
    const [sidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true';
    });

    return (
        <div className={`modern-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <ModernSidebar />

            <main className="main-content">
                <div className="content-wrapper">
                    {children}
                </div>
            </main>

            {/* Mobile bottom navigation */}
            <nav className="mobile-nav">
                <a href="/dashboard" className="mobile-nav-item">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
                    </svg>
                    <span>Inicio</span>
                </a>
                <a href="/map" className="mobile-nav-item">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>Mapa</span>
                </a>
                <a href="/map?action=report" className="mobile-nav-item create">
                    <div className="create-btn-mobile">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                    </div>
                    <span>Crear</span>
                </a>
                <a href="/profile" className="mobile-nav-item">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <span>Perfil</span>
                </a>
            </nav>
        </div>
    );
};

export default ModernLayout;
