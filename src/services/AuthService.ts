import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';

import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User, UserProfile } from '../types';
import logger from '../utils/logger';

export class AuthService {
  // Convertir FirebaseUser a nuestro tipo User
  static async convertFirebaseUser(firebaseUser: FirebaseUser): Promise<User> {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.data();

      // Si el documento no existe, crear el perfil automáticamente
      if (!userDoc.exists()) {
        await this.createUserProfile(firebaseUser);
        // Retornar datos básicos del usuario de Firebase Auth
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: new Date(),
          reportCount: 0
        };
      }

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || userData?.displayName || '',
        photoURL: firebaseUser.photoURL || userData?.photoURL,
        createdAt: userData?.createdAt?.toDate() || new Date(),
        reportCount: userData?.reportCount || 0
      };
    } catch (error) {
      logger.error('Error al acceder al perfil del usuario, usando datos de Firebase Auth:', error);
      // En caso de error, retornar datos básicos de Firebase Auth
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || undefined,
        createdAt: new Date(),
        reportCount: 0
      };
    }
  }

  // Crear perfil de usuario en Firestore
  static async createUserProfile(firebaseUser: FirebaseUser, displayName?: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName || firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || null,
          createdAt: new Date(),
          reportCount: 0
        };

        await setDoc(userRef, userData);
        logger.log('✅ Perfil de usuario creado en Firestore:', firebaseUser.uid);
      } else {
        logger.log('ℹ️ Perfil de usuario ya existe:', firebaseUser.uid);
      }
    } catch (error) {
      logger.error('❌ Error al crear perfil de usuario:', error);
      // No lanzar error para no bloquear el login
    }
  }

  // Registro con email y contraseña
  static async signUpWithEmail(email: string, password: string, displayName: string): Promise<UserCredential> {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Actualizar el perfil con el nombre
    await firebaseUpdateProfile(result.user, { displayName });

    // Crear perfil en Firestore
    await this.createUserProfile(result.user, displayName);

    // Enviar email de verificación
    await sendEmailVerification(result.user);

    return result;
  }

  // Inicio de sesión con email y contraseña
  static async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email, password);
  }

  // Inicio de sesión con Google
  static async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    // Crear perfil si es la primera vez
    await this.createUserProfile(result.user);

    return result;
  }

  // Cerrar sesión
  static async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  // Actualizar perfil
  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('No hay usuario autenticado');
    }

    // Actualizar en Firebase Auth
    if (updates.displayName || updates.photoURL) {
      await firebaseUpdateProfile(auth.currentUser, {
        displayName: updates.displayName,
        photoURL: updates.photoURL
      });
    }

    // Actualizar en Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, updates, { merge: true });
  }

  // Obtener usuario actual
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  // Obtener mensaje de error legible (mantenido por compatibilidad)
  static getErrorMessage(errorCode: string): string {
    const { ErrorHandlerService } = require('./ErrorHandlerService');
    const appError = ErrorHandlerService.handleAuthError({ code: errorCode, message: '' });
    return appError.message;
  }
}