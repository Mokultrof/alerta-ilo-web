import { storage } from '../firebase/config';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

/**
 * Servicio para manejar la subida y gestión de archivos en Firebase Storage
 * VERSIÓN: 3.0 - Solución mejorada para errores de CORS
 */
export class StorageService {
  /**
   * Verifica que Firebase Storage esté inicializado
   */
  private static checkStorageInitialized(): void {
    if (!storage) {
      console.error('❌ Firebase Storage no está inicializado');
      throw new Error('Firebase Storage no está inicializado. Verifica la configuración de Firebase.');
    }
  }
  
  private static readonly REPORTS_IMAGES_PATH = 'reports/images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * Valida un archivo antes de subirlo
   */
  private static validateFile(file: File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('La imagen no debe superar los 5MB');
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Solo se permiten imágenes en formato JPG, PNG o WebP');
    }
  }

  /**
   * Genera un nombre único para el archivo
   */
  private static generateFileName(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop() || 'jpg';
    return `${userId}_${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Sube una imagen a Firebase Storage y retorna la URL de descarga
   * VERSIÓN V5: Solución mejorada para errores de CORS
   */
  static async uploadReportImage(file: File, userId: string): Promise<string> {
    try {
      this.checkStorageInitialized();
      this.validateFile(file);

      console.log('🚀 [V5] Subiendo imagen - Solución CORS mejorada...');
      console.log('👤 Usuario ID:', userId);
      console.log('📄 Archivo:', file.name, 'Tamaño:', (file.size / 1024).toFixed(2) + 'KB', 'Tipo:', file.type);

      const fileName = this.generateFileName(userId, file.name);
      const filePath = `${this.REPORTS_IMAGES_PATH}/${fileName}`;

      console.log('📁 Ruta completa:', filePath);

      // Crear referencia de forma más simple
      const storageRef = ref(storage, filePath);
      
      console.log('⬆️ Iniciando subida...');
      console.log('🔧 Storage info:', {
        bucket: storage.app.options.storageBucket,
        projectId: storage.app.options.projectId
      });
      
      // Metadatos mínimos para evitar problemas de CORS
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'uploadedBy': userId,
          'uploadedAt': new Date().toISOString()
        }
      };

      // Intentar subida con retry automático
      let uploadAttempt = 0;
      const maxAttempts = 3;
      
      while (uploadAttempt < maxAttempts) {
        try {
          uploadAttempt++;
          console.log(`📤 Intento ${uploadAttempt}/${maxAttempts}...`);
          
          const snapshot = await uploadBytes(storageRef, file, metadata);
          
          console.log('✅ Subida completada!');
          console.log('📊 Snapshot:', {
            fullPath: snapshot.ref.fullPath,
            name: snapshot.ref.name,
            bucket: snapshot.ref.bucket
          });

          // Obtener URL de descarga con retry
          console.log('🔗 Obteniendo URL de descarga...');
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          console.log('✅ URL obtenida exitosamente');
          
          return downloadURL;
          
        } catch (attemptError: any) {
          console.warn(`⚠️ Intento ${uploadAttempt} falló:`, attemptError.message);
          
          if (uploadAttempt === maxAttempts) {
            throw attemptError;
          }
          
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempt));
        }
      }
      
      throw new Error('Todos los intentos de subida fallaron');
      
    } catch (error: any) {
      console.error('❌ Error detallado al subir imagen:', {
        code: error.code,
        message: error.message,
        name: error.name
      });

      // Manejo específico de errores
      if (error.code === 'storage/unauthorized') {
        console.error('🔒 Error de autorización');
        throw new Error('Sin permisos para subir imágenes. Verifica tu autenticación.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Subida cancelada');
      } else if (error.code === 'storage/unknown' || error.message?.includes('CORS') || error.message?.includes('404')) {
        console.error('🚫 Error de CORS/Configuración detectado');
        throw new Error('Error de configuración del servidor. Contacta al administrador.');
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Cuota de almacenamiento excedida');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        throw new Error('Error de conexión. Verifica tu internet.');
      }

      // Error genérico
      throw new Error(`Error al subir imagen: ${error.message || 'Error desconocido'}`);
    }
  }

  /**
   * Elimina una imagen de Firebase Storage
   */
  static async deleteReportImage(imageUrl: string): Promise<void> {
    try {
      if (!storage) {
        console.warn('⚠️ Firebase Storage no está inicializado');
        return;
      }

      const urlParts = imageUrl.split('/o/');
      if (urlParts.length < 2) {
        console.warn('⚠️ URL de imagen inválida:', imageUrl);
        return;
      }

      const pathPart = urlParts[1].split('?')[0];
      const filePath = decodeURIComponent(pathPart);

      console.log('🗑️ Eliminando imagen:', filePath);

      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);

      console.log('✅ Imagen eliminada');
    } catch (error: any) {
      console.error('❌ Error al eliminar:', error);

      if (error.code === 'storage/object-not-found') {
        console.warn('⚠️ La imagen ya no existe');
        return;
      }

      throw error;
    }
  }

  /**
   * Comprime una imagen antes de subirla
   */
  private static async compressImage(
    file: File,
    maxWidth: number = 1920,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo crear contexto de canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('No se pudo comprimir la imagen'));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });

              console.log(`🗜️ Comprimido: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };

        img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Sube una imagen con compresión automática
   */
  static async uploadReportImageWithCompression(
    file: File,
    userId: string,
    compress: boolean = true
  ): Promise<string> {
    try {
      let fileToUpload = file;

      if (compress && file.size > 500 * 1024) {
        console.log('🗜️ Comprimiendo imagen...');
        fileToUpload = await this.compressImage(file);
      }

      return await this.uploadReportImage(fileToUpload, userId);
    } catch (error: any) {
      console.error('❌ Error al subir con compresión:', error);
      throw error;
    }
  }
}
