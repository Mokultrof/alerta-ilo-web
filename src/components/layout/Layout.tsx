import React from 'react';
import AlertaIloNav from '../navigation/AlertaIloNav';
import Footer from './Footer';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  showNavigation = true,
  showFooter = true
}) => {
  return (
    <div className="app-layout">
      {showNavigation && <AlertaIloNav />}
      <main className="main-content">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;