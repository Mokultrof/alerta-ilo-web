import { AppError } from '../types';

// Tipos específicos de errores
export interface FirebaseAuthError {
  code: string;
  message: string;
}

export interface FirestoreError {
  code: string;
  message: string;
}

export interface NetworkError {
  code: string;
  message: string;
  status?: number;
}

export interface LocationError {
  code: number;
  message: string;
}

// Códigos de error personalizados
export enum ErrorCodes {
  // Errores de red
  NETWORK_OFFLINE = 'network/offline',
  NETWORK_TIMEOUT = 'network/timeout',
  NETWORK_UNAVAILABLE = 'network/unavailable',
  
  // Errores de autenticación
  AUTH_INVALID_CREDENTIALS = 'auth/invalid-credentials',
  AUTH_USER_NOT_FOUND = 'auth/user-not-found',
  AUTH_NETWORK_ERROR = 'auth/network-error',
  
  // Errores de Firestore
  FIRESTORE_PERMISSION_DENIED = 'firestore/permission-denied',
  FIRESTORE_UNAVAILABLE = 'firestore/unavailable',
  FIRESTORE_QUOTA_EXCEEDED = 'firestore/quota-exceeded',
  
  // Errores de ubicación
  LOCATION_PERMISSION_DENIED = 'location/permission-denied',
  LOCATION_UNAVAILABLE = 'location/unavailable',
  LOCATION_TIMEOUT = 'location/timeout',
  
  // Errores generales
  UNKNOWN_ERROR = 'unknown/error'
}

export class ErrorHandlerService {
  private static retryAttempts = new Map<string, number>();
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly BASE_DELAY = 1000; // 1 segundo

  /**
   * Maneja errores de Firebase Authentication
   */
  static handleAuthError(error: FirebaseAuthError): AppError {
    const { code } = error;
    
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-email':
        return {
          code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
          message: 'Credenciales inválidas. Verifica tu email y contraseña.',
          severity: 'medium'
        };
        
      case 'auth/email-already-in-use':
        return {
          code,
          message: 'Ya existe una cuenta con este email. Intenta iniciar sesión.',
          severity: 'medium'
        };
        
      case 'auth/weak-password':
        return {
          code,
          message: 'La contraseña debe tener al menos 6 caracteres.',
          severity: 'low'
        };
        
      case 'auth/network-request-failed':
        return {
          code: ErrorCodes.AUTH_NETWORK_ERROR,
          message: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
          severity: 'high',
          retry: this.createRetryFunction('auth', () => Promise.resolve())
        };
        
      case 'auth/too-many-requests':
        return {
          code,
          message: 'Demasiados intentos fallidos. Espera unos minutos antes de intentar nuevamente.',
          severity: 'high'
        };
        
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return {
          code,
          message: 'Inicio de sesión cancelado por el usuario.',
          severity: 'low'
        };
        
      default:
        return {
          code: ErrorCodes.UNKNOWN_ERROR,
          message: 'Error de autenticación inesperado. Intenta nuevamente.',
          severity: 'medium'
        };
    }
  }

  /**
   * Maneja errores de Firestore
   */
  static handleFirestoreError(error: FirestoreError): AppError {
    const { code } = error;
    
    switch (code) {
      case 'permission-denied':
        return {
          code: ErrorCodes.FIRESTORE_PERMISSION_DENIED,
          message: 'No tienes permisos para realizar esta acción. Inicia sesión nuevamente.',
          severity: 'high'
        };
        
      case 'unavailable':
        return {
          code: ErrorCodes.FIRESTORE_UNAVAILABLE,
          message: 'Servicio temporalmente no disponible. Intenta nuevamente.',
          severity: 'high',
          retry: this.createRetryFunction('firestore', () => Promise.resolve())
        };
        
      case 'quota-exceeded':
        return {
          code: ErrorCodes.FIRESTORE_QUOTA_EXCEEDED,
          message: 'Límite de uso excedido. Intenta más tarde.',
          severity: 'high'
        };
        
      case 'not-found':
        return {
          code,
          message: 'El documento solicitado no existe.',
          severity: 'medium'
        };
        
      case 'already-exists':
        return {
          code,
          message: 'El documento ya existe.',
          severity: 'low'
        };
        
      case 'failed-precondition':
        return {
          code,
          message: 'Operación no válida en el estado actual.',
          severity: 'medium'
        };
        
      default:
        return {
          code: ErrorCodes.UNKNOWN_ERROR,
          message: 'Error de base de datos. Intenta nuevamente.',
          severity: 'medium',
          retry: this.createRetryFunction('firestore', () => Promise.resolve())
        };
    }
  }

  /**
   * Maneja errores de red
   */
  static handleNetworkError(error: NetworkError): AppError {
    const { status } = error;
    
    if (!navigator.onLine) {
      return {
        code: ErrorCodes.NETWORK_OFFLINE,
        message: 'Sin conexión a internet. Verifica tu conexión.',
        severity: 'high',
        retry: this.createRetryFunction('network', () => Promise.resolve())
      };
    }
    
    switch (status) {
      case 408:
      case 504:
        return {
          code: ErrorCodes.NETWORK_TIMEOUT,
          message: 'Tiempo de espera agotado. Intenta nuevamente.',
          severity: 'medium',
          retry: this.createRetryFunction('network', () => Promise.resolve())
        };
        
      case 500:
      case 502:
      case 503:
        return {
          code: ErrorCodes.NETWORK_UNAVAILABLE,
          message: 'Servicio temporalmente no disponible.',
          severity: 'high',
          retry: this.createRetryFunction('network', () => Promise.resolve())
        };
        
      default:
        return {
          code: ErrorCodes.NETWORK_UNAVAILABLE,
          message: 'Error de conexión. Verifica tu internet.',
          severity: 'medium',
          retry: this.createRetryFunction('network', () => Promise.resolve())
        };
    }
  }

  /**
   * Maneja errores de geolocalización
   */
  static handleLocationError(error: LocationError): AppError {
    const { code } = error;
    
    switch (code) {
      case 1: // PERMISSION_DENIED
        return {
          code: ErrorCodes.LOCATION_PERMISSION_DENIED,
          message: 'Permisos de ubicación denegados. Habilita la ubicación en configuración.',
          severity: 'medium'
        };
        
      case 2: // POSITION_UNAVAILABLE
        return {
          code: ErrorCodes.LOCATION_UNAVAILABLE,
          message: 'Ubicación no disponible. Usando ubicación predeterminada.',
          severity: 'low'
        };
        
      case 3: // TIMEOUT
        return {
          code: ErrorCodes.LOCATION_TIMEOUT,
          message: 'Tiempo de espera agotado al obtener ubicación.',
          severity: 'low',
          retry: this.createRetryFunction('location', () => Promise.resolve())
        };
        
      default:
        return {
          code: ErrorCodes.UNKNOWN_ERROR,
          message: 'Error al obtener ubicación.',
          severity: 'low'
        };
    }
  }

  /**
   * Crea una función de reintento con backoff exponencial
   */
  private static createRetryFunction(operation: string, originalFunction: () => Promise<any>): () => Promise<void> {
    return async () => {
      const attempts = this.retryAttempts.get(operation) || 0;
      
      if (attempts >= this.MAX_RETRY_ATTEMPTS) {
        this.retryAttempts.delete(operation);
        throw new Error('Máximo número de reintentos alcanzado');
      }
      
      // Calcular delay con backoff exponencial
      const delay = this.BASE_DELAY * Math.pow(2, attempts);
      
      // Incrementar contador de intentos
      this.retryAttempts.set(operation, attempts + 1);
      
      // Esperar antes del reintento
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        await originalFunction();
        // Si es exitoso, resetear contador
        this.retryAttempts.delete(operation);
      } catch (error) {
        // Si falla, el contador se mantiene para el próximo intento
        throw error;
      }
    };
  }

  /**
   * Resetea los contadores de reintento para una operación
   */
  static resetRetryCount(operation: string): void {
    this.retryAttempts.delete(operation);
  }

  /**
   * Obtiene el número de intentos realizados para una operación
   */
  static getRetryCount(operation: string): number {
    return this.retryAttempts.get(operation) || 0;
  }

  /**
   * Maneja errores genéricos y los convierte a AppError
   */
  static handleGenericError(error: any, context?: string): AppError {
    console.error(`Error en ${context || 'operación'}:`, error);
    
    // Si ya es un AppError, devolverlo tal como está
    if (error.code && error.message && error.severity) {
      return error as AppError;
    }
    
    // Si es un error de Firebase Auth
    if (error.code && error.code.startsWith('auth/')) {
      return this.handleAuthError(error);
    }
    
    // Si es un error de Firestore
    if (error.code && (error.code.includes('firestore') || error.code.includes('permission') || error.code.includes('unavailable'))) {
      return this.handleFirestoreError(error);
    }
    
    // Si es un error de red
    if (error.status || error.code === 'NETWORK_ERROR') {
      return this.handleNetworkError(error);
    }
    
    // Error genérico
    return {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: error.message || 'Ha ocurrido un error inesperado',
      severity: 'medium'
    };
  }

  /**
   * Registra errores para debugging (en producción se enviaría a un servicio de logging)
   */
  static logError(error: AppError, context?: string, userId?: string): void {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity
      },
      context,
      userId,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // En desarrollo, mostrar en consola
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Log');
      console.error('Error:', error);
      console.info('Context:', context);
      console.info('User ID:', userId);
      console.info('Full Log:', logData);
      console.groupEnd();
    }
    
    // En producción, aquí se enviaría a un servicio de logging como Sentry
    // Sentry.captureException(error, { extra: logData });
  }
}