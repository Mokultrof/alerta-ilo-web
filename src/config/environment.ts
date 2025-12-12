// Configuración de entorno centralizada
import logger from '../utils/logger';

export const environment = {
  // Configuración principal
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Firebase Config - Solo configuración real
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY!,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.REACT_APP_FIREBASE_APP_ID!,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  },
  
  // Mapa
  map: {
    defaultLat: parseFloat(process.env.REACT_APP_DEFAULT_LAT || '-17.6406'),
    defaultLng: parseFloat(process.env.REACT_APP_DEFAULT_LNG || '-71.3369'),
    defaultZoom: parseInt(process.env.REACT_APP_DEFAULT_ZOOM || '13')
  },
  
  // Analytics y Performance
  enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  enablePerformanceMonitoring: process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true',
  
  // Cache
  cache: {
    duration: parseInt(process.env.REACT_APP_CACHE_DURATION || '300000'),
    imageCacheDuration: parseInt(process.env.REACT_APP_IMAGE_CACHE_DURATION || '86400000')
  }
};

// Validar configuración de Firebase
const validateFirebaseConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !environment.firebase[key as keyof typeof environment.firebase]);
  
  if (missingKeys.length > 0) {
    logger.error('❌ Configuración de Firebase incompleta. Variables faltantes:', missingKeys);
    throw new Error(`Configuración de Firebase incompleta: ${missingKeys.join(', ')}`);
  }
  
  logger.log('✅ Configuración de Firebase validada correctamente');
};

// Validar en producción
if (environment.isProduction) {
  validateFirebaseConfig();
}

// Debug en desarrollo
if (environment.isDevelopment) {
  logger.log('🔧 Configuración de entorno:', {
    isDevelopment: environment.isDevelopment,
    firebaseProjectId: environment.firebase.projectId,
    firebaseStorageBucket: environment.firebase.storageBucket
  });
}

export default environment;