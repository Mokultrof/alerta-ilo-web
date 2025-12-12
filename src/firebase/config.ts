import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import environment from '../config/environment';
import logger from '../utils/logger';

const firebaseConfig = environment.firebase;

// Debug: Verificar configuración completa
logger.log('🔥 Configuración Firebase:', {
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  isDevelopment: environment.isDevelopment
});

// Debug: Verificar variables de entorno
logger.log('🔍 Variables de entorno:', {
  REACT_APP_FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID
});

// Validar configuración en producción
if (process.env.REACT_APP_ENVIRONMENT === 'production') {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig] || firebaseConfig[key as keyof typeof firebaseConfig]?.toString().includes('demo-'));
  
  if (missingKeys.length > 0) {
    logger.error('❌ Missing Firebase configuration keys:', missingKeys);
    throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
  }
}

// Inicializar Firebase
logger.log('🔥 Inicializando Firebase...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Inicializar Storage - Forma estándar sin URL específica
const storage = getStorage(app);

// Verificar inicialización
logger.log('✅ Firebase inicializado correctamente');
logger.log('✅ Firestore inicializado:', db ? 'OK' : 'ERROR');
logger.log('✅ Storage inicializado con bucket:', firebaseConfig.storageBucket);

// Exportar servicios
export { auth, db, storage };

// Exportar configuración desde environment
export const isProduction = environment.isProduction;
export const enableAnalytics = environment.enableAnalytics;
export const enablePerformanceMonitoring = environment.enablePerformanceMonitoring;
export const cacheConfig = environment.cache;

export default app;
