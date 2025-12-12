import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { AuthContextType, User, UserProfile } from '../types';
import { AuthService } from '../services/AuthService';
import { ErrorHandlerService } from '../services/ErrorHandlerService';
import logger from '../utils/logger';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);



  // Registro con email y contraseña
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      await AuthService.signUpWithEmail(email, password, displayName);
      logger.log('Usuario registrado exitosamente. Por favor verifica tu email.');
    } catch (error: any) {
      logger.error('Error en registro:', error);
      const appError = ErrorHandlerService.handleAuthError(error);
      throw new Error(appError.message);
    }
  };

  // Inicio de sesión con email y contraseña
  const signIn = async (email: string, password: string) => {
    try {
      await AuthService.signInWithEmail(email, password);
    } catch (error: any) {
      logger.error('Error en inicio de sesión:', error);
      const appError = ErrorHandlerService.handleAuthError(error);
      throw new Error(appError.message);
    }
  };

  // Inicio de sesión con Google
  const signInWithGoogle = async () => {
    try {
      await AuthService.signInWithGoogle();
    } catch (error: any) {
      logger.error('Error en inicio de sesión con Google:', error);
      const appError = ErrorHandlerService.handleAuthError(error);
      throw new Error(appError.message);
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      await AuthService.signOut();
      setUser(null);
    } catch (error: any) {
      logger.error('Error al cerrar sesión:', error);
      setUser(null);
    }
  };

  // Actualizar perfil
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No hay usuario autenticado');

    try {
      await AuthService.updateProfile(user.uid, updates);
      // Actualizar estado local
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error: any) {
      logger.error('Error al actualizar perfil:', error);
      throw new Error('Error al actualizar perfil');
    }
  };

  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await AuthService.convertFirebaseUser(firebaseUser);
          setUser(userData);
        } catch (error) {
          logger.error('Error al cargar datos del usuario:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};