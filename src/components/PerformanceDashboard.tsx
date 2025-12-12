import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PerformanceMonitorService, PerformanceReport } from '../services/PerformanceMonitorService';
import { CacheService } from '../services/CacheService';
import { BackgroundSyncService, SyncStatus } from '../services/BackgroundSyncService';
import './PerformanceDashboard.css';

interface PerformanceDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Dashboard de rendimiento para monitorear optimizaciones
 * Solo visible en modo desarrollo
 */
export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isVisible,
  onClose
}) => {
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const performanceMonitor = PerformanceMonitorService.getInstance();
  const cacheService = CacheService.getInstance();
  const backgroundSync = BackgroundSyncService.getInstance();

  const updateStats = useCallback(() => {
    try {
      const report = performanceMonitor.generateReport();
      const cache = cacheService.getCacheStats();
      const realTime = performanceMonitor.getRealTimeStats();
      
      setPerformanceReport(report);
      setCacheStats(cache);
      setRealTimeStats(realTime);
    } catch (error) {
      console.error('Error al actualizar estadísticas de rendimiento:', error);
    }
  }, [performanceMonitor, cacheService]);

  useEffect(() => {
    if (isVisible) {
      // Cargar datos iniciales
      updateStats();
      
      // Configurar actualización automática
      const interval = setInterval(updateStats, 2000); // Cada 2 segundos
      refreshIntervalRef.current = interval;
      
      // Suscribirse a cambios de sincronización
      const unsubscribe = backgroundSync.subscribe(setSyncStatus);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        unsubscribe();
      };
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }
  }, [isVisible, backgroundSync, updateStats]);

  const handleClearCache = () => {
    cacheService.clearAllCache();
    updateStats();
  };

  const handleForcSync = async () => {
    try {
      await backgroundSync.forceSyncNow();
      updateStats();
    } catch (error) {
      console.error('Error al forzar sincronización:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="performance-dashboard">
      <div className="performance-dashboard-overlay" onClick={onClose} />
      <div className="performance-dashboard-content">
        <div className="performance-dashboard-header">
          <h2>📊 Dashboard de Rendimiento</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="performance-dashboard-body">
          {/* Estadísticas en tiempo real */}
          <div className="stats-section">
            <h3>📈 Estadísticas en Tiempo Real</h3>
            {realTimeStats && (
              <div className="real-time-stats">
                <div className="stat-item">
                  <span className="stat-label">FPS:</span>
                  <span className={`stat-value ${realTimeStats.fps < 30 ? 'warning' : 'good'}`}>
                    {realTimeStats.fps}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Memoria:</span>
                  <span className="stat-value">
                    {(realTimeStats.memoryUsage / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Red:</span>
                  <span className="stat-value">{realTimeStats.networkActivity} req/min</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Caché:</span>
                  <span className={`stat-value ${realTimeStats.cacheEfficiency < 50 ? 'warning' : 'good'}`}>
                    {realTimeStats.cacheEfficiency}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Resumen de rendimiento */}
          {performanceReport && (
            <div className="stats-section">
              <h3>⚡ Resumen de Rendimiento</h3>
              <div className="performance-summary">
                <div className="summary-item">
                  <span className="summary-label">Tiempo de Carga Promedio:</span>
                  <span className={`summary-value ${performanceReport.summary.averageLoadTime > 3000 ? 'warning' : 'good'}`}>
                    {performanceReport.summary.averageLoadTime.toFixed(0)}ms
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Tasa de Acierto de Caché:</span>
                  <span className={`summary-value ${performanceReport.summary.cacheHitRate < 50 ? 'warning' : 'good'}`}>
                    {performanceReport.summary.cacheHitRate.toFixed(1)}%
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Solicitudes de Red:</span>
                  <span className="summary-value">{performanceReport.summary.networkRequests}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Tiempo de Renderizado:</span>
                  <span className={`summary-value ${performanceReport.summary.renderTime > 100 ? 'warning' : 'good'}`}>
                    {performanceReport.summary.renderTime.toFixed(0)}ms
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Estadísticas de caché */}
          {cacheStats && (
            <div className="stats-section">
              <h3>💾 Estadísticas de Caché</h3>
              <div className="cache-stats">
                <div className="cache-category">
                  <h4>Reportes</h4>
                  <p>Entradas: {cacheStats.reports.entries}</p>
                  <p>Tamaño: {cacheStats.reports.size}</p>
                </div>
                <div className="cache-category">
                  <h4>Imágenes</h4>
                  <p>Entradas: {cacheStats.images.entries}</p>
                  <p>Tamaño: {cacheStats.images.size}</p>
                </div>
                <div className="cache-category">
                  <h4>Consultas</h4>
                  <p>Entradas: {cacheStats.queries.entries}</p>
                  <p>Tamaño: {cacheStats.queries.size}</p>
                </div>
              </div>
              <button className="action-button warning" onClick={handleClearCache}>
                🗑️ Limpiar Caché
              </button>
            </div>
          )}

          {/* Estado de sincronización */}
          {syncStatus && (
            <div className="stats-section">
              <h3>🔄 Estado de Sincronización</h3>
              <div className="sync-status">
                <div className="sync-item">
                  <span className="sync-label">Estado:</span>
                  <span className={`sync-value ${syncStatus.isActive ? 'good' : 'warning'}`}>
                    {syncStatus.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="sync-item">
                  <span className="sync-label">Operaciones Pendientes:</span>
                  <span className={`sync-value ${syncStatus.pendingOperations > 0 ? 'warning' : 'good'}`}>
                    {syncStatus.pendingOperations}
                  </span>
                </div>
                <div className="sync-item">
                  <span className="sync-label">Sincronizando:</span>
                  <span className={`sync-value ${syncStatus.syncInProgress ? 'active' : ''}`}>
                    {syncStatus.syncInProgress ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="sync-item">
                  <span className="sync-label">Última Sincronización:</span>
                  <span className="sync-value">
                    {syncStatus.lastSyncTime 
                      ? new Date(syncStatus.lastSyncTime).toLocaleTimeString()
                      : 'Nunca'
                    }
                  </span>
                </div>
              </div>
              {syncStatus.pendingOperations > 0 && (
                <button className="action-button primary" onClick={handleForcSync}>
                  🔄 Forzar Sincronización
                </button>
              )}
              {syncStatus.errors.length > 0 && (
                <div className="sync-errors">
                  <h4>❌ Errores de Sincronización:</h4>
                  <ul>
                    {syncStatus.errors.slice(0, 3).map((error) => (
                      <li key={`error-${error.slice(0, 20)}-${error.length}`}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Recomendaciones */}
          {performanceReport && performanceReport.recommendations.length > 0 && (
            <div className="stats-section">
              <h3>💡 Recomendaciones</h3>
              <ul className="recommendations">
                {performanceReport.recommendations.map((recommendation) => (
                  <li key={`rec-${recommendation.slice(0, 20)}-${recommendation.length}`}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="performance-dashboard-footer">
          <button className="action-button secondary" onClick={updateStats}>
            🔄 Actualizar
          </button>
          <button className="action-button primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook para mostrar/ocultar el dashboard en desarrollo
export const usePerformanceDashboard = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Solo disponible en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const handleKeyPress = (event: KeyboardEvent) => {
        // Ctrl + Shift + P para abrir/cerrar
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
          event.preventDefault();
          setIsVisible(prev => !prev);
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, []);

  return {
    isVisible,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible(prev => !prev)
  };
};