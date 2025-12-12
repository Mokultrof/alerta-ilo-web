/**
 * Servicio para manejar reportes comunitarios con Firebase Firestore
 */

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  DocumentSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { Report, CreateReportData, ReportCategory, ReportStatus } from '../types';
import logger from '../utils/logger';

export interface UserReportStats {
  totalReports: number;
  activeReports: number;
  inProgressReports: number;
  resolvedReports: number;
  totalLikes: number;
  mostUsedCategory: string;
  joinDate: Date;
}

export interface UpdateReportData {
  title?: string;
  description?: string;
  category?: ReportCategory;
  priority?: 'low' | 'medium' | 'high';
  status?: ReportStatus;
  imageUrl?: string;
}

export enum ReportErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_DATA = 'INVALID_DATA',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ReportError {
  code: ReportErrorCode;
  message: string;
  details?: any;
}

export class ReportsService {
  private static readonly COLLECTION_NAME = 'reports';

  /**
   * Convierte un documento de Firestore a objeto Report
   */
  private static firestoreToReport(doc: DocumentSnapshot): Report | null {
    if (!doc.exists()) return null;

    const data = doc.data();

    // Manejar variaciones en la estructura de ubicación (legacy support)
    let location = data.location;
    if (location) {
      // Si tiene latitude/longitude pero no lat/lng, mapearlo
      if (typeof location.lat === 'undefined' && typeof location.latitude !== 'undefined') {
        location = {
          lat: location.latitude,
          lng: location.longitude,
          address: location.address || 'Ubicación registrada',
          placeName: location.placeName
        };
      }
    } else {
      // Fallback si no hay ubicación
      location = { lat: -17.6445, lng: -71.3468, address: 'Ilo, Perú' };
    }

    return {
      id: doc.id,
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      category: data.category || 'other', // Fallback category
      title: data.title || 'Sin título',
      description: data.description || '',
      location: location,
      imageUrl: data.imageUrl,
      status: data.status || 'active',
      priority: data.priority || 'medium',
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      likes: data.likes || 0,
      likedBy: data.likedBy || [],
      comments: data.comments || 0
    };
  }

  /**
   * Maneja errores de Firebase y los convierte a ReportError
   */
  private static handleFirebaseError(error: any, context: string): ReportError {
    logger.error(`Error en ${context}:`, error);

    if (error.code === 'permission-denied') {
      return {
        code: ReportErrorCode.PERMISSION_DENIED,
        message: 'No tienes permisos para realizar esta acción',
        details: error
      };
    }

    if (error.code === 'not-found') {
      return {
        code: ReportErrorCode.NOT_FOUND,
        message: 'El reporte no existe o fue eliminado',
        details: error
      };
    }

    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return {
        code: ReportErrorCode.NETWORK_ERROR,
        message: 'Error de conexión. Verifica tu internet e intenta de nuevo',
        details: error
      };
    }

    if (error.code === 'invalid-argument') {
      return {
        code: ReportErrorCode.INVALID_DATA,
        message: 'Los datos del reporte no son válidos',
        details: error
      };
    }

    return {
      code: ReportErrorCode.UNKNOWN_ERROR,
      message: 'Error inesperado. Intenta de nuevo',
      details: error
    };
  }

  /**
   * Crea un nuevo reporte en Firestore
   */
  static async createReport(
    reportData: CreateReportData,
    userId: string,
    userName: string,
    userAvatar?: string
  ): Promise<Report> {
    try {
      logger.log('📝 Creando reporte en Firestore:', { userId, title: reportData.title });

      const reportDoc = {
        userId,
        userName,
        userAvatar: userAvatar || null,
        category: reportData.category,
        title: reportData.title,
        description: reportData.description,
        location: reportData.location,
        imageUrl: reportData.imageUrl || null,
        status: 'active' as ReportStatus,
        priority: reportData.priority || 'medium',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        comments: 0
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), reportDoc);

      // Obtener el documento creado para retornar con el ID
      const createdDoc = await getDoc(docRef);
      const report = this.firestoreToReport(createdDoc);

      if (!report) {
        throw new Error('Error al crear el reporte');
      }

      logger.log('✅ Reporte creado exitosamente:', report.id);
      return report;

    } catch (error: any) {
      const reportError = this.handleFirebaseError(error, 'createReport');
      throw reportError;
    }
  }

  /**
   * Obtiene todos los reportes con paginación opcional
   */
  static async getAllReports(
    limitCount: number = 50,
    lastDoc?: DocumentSnapshot
  ): Promise<Report[]> {
    try {
      logger.log('📋 Obteniendo reportes desde Firestore');

      let q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const reports: Report[] = [];

      querySnapshot.forEach((doc) => {
        const report = this.firestoreToReport(doc);
        if (report) {
          reports.push(report);
        }
      });

      logger.log(`✅ Obtenidos ${reports.length} reportes`);
      return reports;

    } catch (error: any) {
      const reportError = this.handleFirebaseError(error, 'getAllReports');
      throw reportError;
    }
  }

  /**
   * Suscribe a cambios en reportes de un usuario en tiempo real
   */
  static subscribeToUserReports(
    userId: string,
    callback: (reports: Report[]) => void
  ): Unsubscribe {
    logger.log('👂 Suscribiendo a reportes del usuario:', userId);

    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const reports: Report[] = [];

      querySnapshot.forEach((doc) => {
        const report = this.firestoreToReport(doc);
        if (report) {
          reports.push(report);
        }
      });

      logger.log(`🔄 Reportes del usuario actualizados: ${reports.length}`);
      callback(reports);
    }, (error) => {
      logger.error('Error en listener de reportes:', error);

      // CORRECCIÓN: Quitamos "const reportError ="
      this.handleFirebaseError(error, 'subscribeToUserReports');

      // En caso de error, llamar callback con array vacío
      callback([]);
    });
  }

  /**
   * Obtiene reportes por categoría
   */
  static async getReportsByCategory(category: ReportCategory): Promise<Report[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reports: Report[] = [];

      querySnapshot.forEach((doc) => {
        const report = this.firestoreToReport(doc);
        if (report) {
          reports.push(report);
        }
      });

      return reports;

    } catch (error: any) {
      const reportError = this.handleFirebaseError(error, 'getReportsByCategory');
      throw reportError;
    }
  }

  /**
   * Obtiene reportes por estado
   */
  /**
     * Obtiene todos los reportes creados por un usuario específico
     */
  static async getReportsByUser(userId: string): Promise<Report[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId), // ⚠️ Asegúrate que en Firebase el campo se llame 'userId'
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const reports: Report[] = [];

      querySnapshot.forEach((doc) => {
        // Reutilizamos tu método existente para convertir los datos
        const report = this.firestoreToReport(doc);
        if (report) {
          reports.push(report);
        }
      });

      return reports;

    } catch (error: any) {
      const reportError = this.handleFirebaseError(error, 'getReportsByUser');
      throw reportError;
    }
  }

  /**
   * Actualiza un reporte (solo si el usuario es el creador)
   */
  static async updateReport(
    reportId: string,
    updates: UpdateReportData,
    userId: string
  ): Promise<Report> {
    try {
      logger.log('✏️ Actualizando reporte:', { reportId, userId });

      // Primero verificar que el reporte existe y el usuario tiene permisos
      const reportRef = doc(db, this.COLLECTION_NAME, reportId);
      const reportDoc = await getDoc(reportRef);

      if (!reportDoc.exists()) {
        throw {
          code: 'not-found',
          message: 'El reporte no existe'
        };
      }

      const reportData = reportDoc.data();
      if (reportData.userId !== userId) {
        throw {
          code: 'permission-denied',
          message: 'No tienes permisos para editar este reporte'
        };
      }

      // Actualizar el documento
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(reportRef, updateData);

      // Obtener el documento actualizado
      const updatedDoc = await getDoc(reportRef);
      const updatedReport = this.firestoreToReport(updatedDoc);

      if (!updatedReport) {
        throw new Error('Error al obtener el reporte actualizado');
      }

      logger.log('✅ Reporte actualizado exitosamente');
      return updatedReport;

    } catch (error: any) {
      const reportError = this.handleFirebaseError(error, 'updateReport');
      throw reportError;
    }
  }

  /**
   * Elimina un reporte (solo si el usuario es el creador)
   */
  static async deleteReport(
    reportId: string,
    userId: string,
    imageUrl?: string
  ): Promise<void> {
    try {
      logger.log('🗑️ Eliminando reporte:', { reportId, userId });

      // Primero verificar que el reporte existe y el usuario tiene permisos
      const reportRef = doc(db, this.COLLECTION_NAME, reportId);
      const reportDoc = await getDoc(reportRef);

      if (!reportDoc.exists()) {
        throw {
          code: 'not-found',
          message: 'El reporte no existe'
        };
      }

      const reportData = reportDoc.data();
      if (reportData.userId !== userId) {
        throw {
          code: 'permission-denied',
          message: 'No tienes permisos para eliminar este reporte'
        };
      }

      // Eliminar imagen de Storage si existe
      if (imageUrl || reportData.imageUrl) {
        try {
          const imageToDelete = imageUrl || reportData.imageUrl;
          const imageRef = ref(storage, imageToDelete);
          await deleteObject(imageRef);
          logger.log('🖼️ Imagen eliminada de Storage');
        } catch (storageError) {
          logger.error('Error eliminando imagen de Storage:', storageError);
          // No fallar la eliminación del reporte si falla la imagen
        }
      }

      // Eliminar el documento de Firestore
      await deleteDoc(reportRef);

      logger.log('✅ Reporte eliminado exitosamente');

    } catch (error: any) {
      const reportError = this.handleFirebaseError(error, 'deleteReport');
      throw reportError;
    }
  }

  /**
   * Da like a un reporte
   */
  static async likeReport(reportId: string, userId: string): Promise<Report> {
    try {
      const reportRef = doc(db, this.COLLECTION_NAME, reportId);
      const reportDoc = await getDoc(reportRef);

      if (!reportDoc.exists()) {
        throw {
          code: 'not-found',
          message: 'El reporte no existe'
        };
      }

      const reportData = reportDoc.data();
      const likedBy = reportData.likedBy || [];

      if (!likedBy.includes(userId)) {
        await updateDoc(reportRef, {
          likes: (reportData.likes || 0) + 1,
          likedBy: [...likedBy, userId],
          updatedAt: serverTimestamp()
        });
      }

      const updatedDoc = await getDoc(reportRef);
      const updatedReport = this.firestoreToReport(updatedDoc);

      if (!updatedReport) {
        throw new Error('Error al obtener el reporte actualizado');
      }

      return updatedReport;

    } catch (error: any) {
      const reportError = this.handleFirebaseError(error, 'likeReport');
      throw reportError;
    }
  }

  /**
   * Quita like de un reporte
   */
  static async unlikeReport(reportId: string, userId: string): Promise<Report> {
    try {
      const reportRef = doc(db, this.COLLECTION_NAME, reportId);
      const reportDoc = await getDoc(reportRef);

      if (!reportDoc.exists()) {
        throw {
          code: 'not-found',
          message: 'El reporte no existe'
        };
      }

      const reportData = reportDoc.data();
      const likedBy = reportData.likedBy || [];

      if (likedBy.includes(userId)) {
        const newLikedBy = likedBy.filter((id: string) => id !== userId);
        await updateDoc(reportRef, {
          likes: Math.max((reportData.likes || 0) - 1, 0),
          likedBy: newLikedBy,
          updatedAt: serverTimestamp()
        });
      }

      const updatedDoc = await getDoc(reportRef);
      const updatedReport = this.firestoreToReport(updatedDoc);

      if (!updatedReport) {
        throw new Error('Error al obtener el reporte actualizado');
      }

      return updatedReport;

    } catch (error: any) {
      const reportError = this.handleFirebaseError(error, 'unlikeReport');
      throw reportError;
    }
  }

  /**
   * Busca reportes por texto
   */
  static async searchReports(query: string): Promise<Report[]> {
    try {
      // Nota: Firestore no tiene búsqueda de texto completo nativa
      // Esta es una implementación básica que obtiene todos los reportes y filtra en el cliente
      // Para producción, se recomienda usar Algolia o similar

      const allReports = await this.getAllReports(100); // Limitar para performance
      const lowercaseQuery = query.toLowerCase();

      return allReports.filter(report =>
        report.title.toLowerCase().includes(lowercaseQuery) ||
        report.description.toLowerCase().includes(lowercaseQuery) ||
        report.location.address.toLowerCase().includes(lowercaseQuery)
      );

    } catch (error: any) {
      const reportError = this.handleFirebaseError(error, 'searchReports');
      throw reportError;
    }
  }

  /**
   * Obtiene estadísticas de reportes del usuario
   */
  static async getUserStats(userId: string): Promise<UserReportStats> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const reports: Report[] = [];

      querySnapshot.forEach((doc) => {
        const report = this.firestoreToReport(doc);
        if (report) {
          reports.push(report);
        }
      });

      // Calcular estadísticas
      const totalReports = reports.length;
      const activeReports = reports.filter(r => r.status === 'active').length;
      const inProgressReports = reports.filter(r => r.status === 'in_progress').length;
      const resolvedReports = reports.filter(r => r.status === 'resolved').length;
      const totalLikes = reports.reduce((sum, report) => sum + report.likes, 0);

      // Encontrar categoría más usada
      const categoryCount: Record<string, number> = {};
      reports.forEach(report => {
        categoryCount[report.category] = (categoryCount[report.category] || 0) + 1;
      });

      const mostUsedCategory = Object.keys(categoryCount).reduce((a, b) =>
        categoryCount[a] > categoryCount[b] ? a : b, 'infrastructure'
      );

      // Fecha de registro (usar la fecha del primer reporte como aproximación)
      const joinDate = reports.length > 0
        ? reports.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0].createdAt
        : new Date();

      return {
        totalReports,
        activeReports,
        inProgressReports,
        resolvedReports,
        totalLikes,
        mostUsedCategory,
        joinDate
      };

    } catch (error: any) {
      const reportError = this.handleFirebaseError(error, 'getUserStats');
      throw reportError;
    }
  }

  /**
   * Obtiene estadísticas generales de reportes
   */
  static async getReportsStats(): Promise<{
    total: number;
    active: number;
    inProgress: number;
    resolved: number;
    byCategory: Record<ReportCategory, number>;
  }> {
    try {
      const allReports = await this.getAllReports(1000); // Obtener una muestra grande

      const stats = {
        total: allReports.length,
        active: allReports.filter(r => r.status === 'active').length,
        inProgress: allReports.filter(r => r.status === 'in_progress').length,
        resolved: allReports.filter(r => r.status === 'resolved').length,
        byCategory: {
          infrastructure: allReports.filter(r => r.category === 'infrastructure').length,
          utilities: allReports.filter(r => r.category === 'utilities').length,
          safety: allReports.filter(r => r.category === 'safety').length,
          environment: allReports.filter(r => r.category === 'environment').length,
          events: allReports.filter(r => r.category === 'events').length,
          other: allReports.filter(r => r.category === 'other').length,
        } as Record<ReportCategory, number>
      };

      return stats;

    } catch (error: any) {
      const reportError = this.handleFirebaseError(error, 'getReportsStats');
      throw reportError;
    }
  }

  /**
   * Valida si un usuario puede modificar un reporte
   */
  static canModifyReport(report: Report, userId: string): boolean {
    return report.userId === userId;
  }

  /**
   * Obtiene un reporte por ID
   */
  static async getReportById(reportId: string): Promise<Report | null> {
    try {
      const reportRef = doc(db, this.COLLECTION_NAME, reportId);
      const reportDoc = await getDoc(reportRef);

      return this.firestoreToReport(reportDoc);

    } catch (error: any) {
      const reportError = this.handleFirebaseError(error, 'getReportById');
      throw reportError;
    }
  }
}