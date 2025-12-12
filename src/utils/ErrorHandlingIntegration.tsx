import React from 'react';
import { ErrorProvider } from '../contexts/ErrorContext';
import { ErrorBoundary, MapErrorBoundary, AuthErrorBoundary } from '../components/ErrorBoundary';
// ErrorNotificationSystem eliminado - usar ErrorBoundary en su lugar

/**
 * Ejemplo de integración del sistema de manejo de errores
 * 
 * Este archivo muestra cómo integrar todos los componentes de manejo de errores
 * en la aplicación principal.
 */

// Wrapper principal de la aplicación con manejo de errores
export const AppWithErrorHandling: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </ErrorProvider>
  );
};

// Wrapper para componentes de mapa
export const MapWithErrorHandling: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MapErrorBoundary>
      {children}
    </MapErrorBoundary>
  );
};

// Wrapper para componentes de autenticación
export const AuthWithErrorHandling: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthErrorBoundary>
      {children}
    </AuthErrorBoundary>
  );
};

/**
 * Ejemplo de uso en componentes:
 * 
 * ```tsx
 * import { useErrorHandler } from '../contexts/ErrorContext';
 * import { useErrorNotification } from '../components/ErrorNotificationSystem';
 * 
 * const MyComponent = () => {
 *   const { withErrorHandling } = useErrorHandler();
 *   const { showSuccess, showError } = useErrorNotification();
 * 
 *   const handleCreateReport = withErrorHandling(async (reportData) => {
 *     const reportId = await FirestoreService.createReport(reportData, userId, userName);
 *     showSuccess('Reporte creado exitosamente');
 *     return reportId;
 *   }, 'Crear reporte');
 * 
 *   return (
 *     <div>
 *       <button onClick={() => handleCreateReport(reportData)}>
 *         Crear Reporte
 *       </button>
 *     </div>
 *   );
 * };
 * ```
 */