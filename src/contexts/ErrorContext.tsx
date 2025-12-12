import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AppError, ErrorContextType } from '../types';
import { ErrorHandlerService } from '../services/ErrorHandlerService';

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError debe ser usado dentro de un ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<AppError[]>([]);

  // Remover un error específico
  const removeError = useCallback((errorCode: string) => {
    setErrors(prevErrors => prevErrors.filter(error => error.code !== errorCode));
  }, []);

  // Agregar un error al estado global
  const addError = useCallback((error: AppError) => {
    // Registrar el error para debugging
    ErrorHandlerService.logError(error);
    
    // Evitar duplicados basados en el código de error
    setErrors(prevErrors => {
      const existingError = prevErrors.find(e => e.code === error.code);
      if (existingError) {
        return prevErrors; // No agregar si ya existe
      }
      return [...prevErrors, error];
    });

    // Auto-remover errores de baja severidad después de 5 segundos
    if (error.severity === 'low') {
      setTimeout(() => {
        removeError(error.code);
      }, 5000);
    }
  }, [removeError]);

  // Limpiar todos los errores
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Verificar si hay errores
  const hasErrors = errors.length > 0;

  // Función helper para manejar errores de forma consistente
  const handleError = useCallback((error: any, context?: string) => {
    const appError = ErrorHandlerService.handleGenericError(error, context);
    addError(appError);
    return appError;
  }, [addError]);

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    hasErrors,
    handleError
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

// Hook personalizado para manejar errores de forma más conveniente
export const useErrorHandler = () => {
  const { handleError, addError } = useError();

  // Wrapper para funciones async que maneja errores automáticamente
  const withErrorHandling = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      context?: string
    ) => {
      return async (...args: T): Promise<R | null> => {
        try {
          return await fn(...args);
        } catch (error) {
          handleError(error, context);
          return null;
        }
      };
    },
    [handleError]
  );

  // Función para manejar errores síncronos
  const handleSyncError = useCallback(
    (error: any, context?: string) => {
      return handleError(error, context);
    },
    [handleError]
  );

  // Función para agregar errores personalizados
  const addCustomError = useCallback(
    (message: string, severity: AppError['severity'] = 'medium', code?: string) => {
      const error: AppError = {
        code: code || 'custom/error',
        message,
        severity
      };
      addError(error);
    },
    [addError]
  );

  return {
    withErrorHandling,
    handleSyncError,
    addCustomError
  };
};