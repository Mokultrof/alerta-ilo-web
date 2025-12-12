/**
 * Sistema de logging condicional
 * Solo muestra logs en desarrollo, excepto errores que siempre se muestran
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log general - solo en desarrollo
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Errores - siempre se muestran
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Warnings - solo en desarrollo
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Info - solo en desarrollo
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Debug - solo en desarrollo
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Tabla - solo en desarrollo
   */
  table: (data: any) => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * Grupo - solo en desarrollo
   */
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * Fin de grupo - solo en desarrollo
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  }
};

export default logger;
