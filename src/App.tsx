import React, { useEffect } from 'react';
import { AuthProvider as FirebaseAuthProvider } from './contexts/AuthContext';
import { PostsProvider } from './contexts/PostsContext';
import AppRouter from './router/AppRouter';
import { PerformanceDashboard, usePerformanceDashboard } from './components/PerformanceDashboard';
import { PerformanceMonitorService } from './services/PerformanceMonitorService';
import { BackgroundSyncService } from './services/BackgroundSyncService';
import { CacheService } from './services/CacheService';
import AccessibilityService from './utils/accessibility';
import logger from './utils/logger';
import './i18n';
import './App.css';
import './styles/accessibility.css';
import './styles/modals.css';
import './styles/spotshare-theme.css';

function App() {
  const { isVisible, hide } = usePerformanceDashboard();
  
  logger.log('🔧 App iniciando...');

  // Inicializar servicios de optimización y accesibilidad
  useEffect(() => {
    logger.log('🚀 Inicializando servicios de optimización y accesibilidad...');
    
    // Inicializar servicios
    const performanceMonitor = PerformanceMonitorService.getInstance();
    const _backgroundSync = BackgroundSyncService.getInstance();
    const _cacheService = CacheService.getInstance();
    const _accessibilityService = AccessibilityService.getInstance();
    
    // Marcar inicio de la aplicación
    performanceMonitor.markStart('App Initialization');
    
    // Configurar limpieza al desmontar
    return () => {
      performanceMonitor.markEnd('App Initialization', 'loading');
      logger.log('🧹 Limpiando servicios de optimización y accesibilidad...');
    };
  }, []);

  // Usar siempre Firebase por ahora ya que está configurado
  const AuthProvider = FirebaseAuthProvider;

  return (
    <AuthProvider>
      <PostsProvider>
        <div className="App">
          {/* Skip to main content link for accessibility */}
          <a href="#main-content" className="skip-link">
            Saltar al contenido principal
          </a>
          
          <AppRouter />
          
          {/* Dashboard de rendimiento (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <PerformanceDashboard 
              isVisible={isVisible} 
              onClose={hide} 
            />
          )}
        </div>
      </PostsProvider>
    </AuthProvider>
  );
}

export default App;
