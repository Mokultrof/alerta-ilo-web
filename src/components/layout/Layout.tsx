import React from 'react';
import AlertaIloNav from '../navigation/AlertaIloNav';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNavigation = true }) => {
  return (
    <div className="app-layout">
      {showNavigation && <AlertaIloNav />}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;