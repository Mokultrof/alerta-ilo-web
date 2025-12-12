import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError } from '../types';
import { ErrorHandlerService } from '../services/ErrorHandlerService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Convertir el error a AppError
    const appError = ErrorHandlerService.handleGenericError(error, 'ErrorBoundary');
    
    return {
      hasError: true,
      error: appError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Registrar el error
    const appError = ErrorHandlerService.handleGenericError(error, 'ErrorBoundary');
    ErrorHandlerService.logError(appError, 'React Error Boundary', undefined);
    
    // Llamar callback si existe
    if (this.props.onError) {
      this.props.onError(appError);
    }

    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback por defecto
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>🚨 Algo salió mal</h2>
            <p>Ha ocurrido un error inesperado en la aplicación.</p>
            
            {this.state.error && (
              <details className="error-details">
                <summary>Detalles del error</summary>
                <p><strong>Código:</strong> {this.state.error.code}</p>
                <p><strong>Mensaje:</strong> {this.state.error.message}</p>
                <p><strong>Severidad:</strong> {this.state.error.severity}</p>
              </details>
            )}
            
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="retry-button"
              >
                🔄 Intentar nuevamente
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="reload-button"
              >
                🔃 Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Boundary específico para componentes de mapa
export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const appError = ErrorHandlerService.handleGenericError(error, 'MapErrorBoundary');
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    const appError = ErrorHandlerService.handleGenericError(error, 'MapErrorBoundary');
    ErrorHandlerService.logError(appError, 'Map Error Boundary', undefined);
    
    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="map-error-fallback">
          <div className="map-error-content">
            <h3>🗺️ Error en el mapa</h3>
            <p>No se pudo cargar el mapa correctamente.</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="retry-button"
            >
              🔄 Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Boundary específico para autenticación
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const appError = ErrorHandlerService.handleGenericError(error, 'AuthErrorBoundary');
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    const appError = ErrorHandlerService.handleGenericError(error, 'AuthErrorBoundary');
    ErrorHandlerService.logError(appError, 'Auth Error Boundary', undefined);
    
    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-error-fallback">
          <div className="auth-error-content">
            <h3>🔐 Error de autenticación</h3>
            <p>Hubo un problema con el sistema de autenticación.</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="login-button"
            >
              🔑 Ir a inicio de sesión
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}