import { OfflineQueueService, QueuedOperation } from './OfflineQueueService';
import { CacheService } from './CacheService';
import { CreatePostData } from '../types';

// Tipos para sincronización en background
export interface SyncStatus {
  isActive: boolean;
  lastSyncTime: number | null;
  pendingOperations: number;
  syncInProgress: boolean;
  errors: string[];
}

export interface SyncResult {
  success: boolean;
  syncedOperations: number;
  failedOperations: number;
  errors: string[];
}

/**
 * Servicio de sincronización en background para operaciones offline
 * Maneja la sincronización automática cuando se restaura la conexión
 */
export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private offlineQueue: OfflineQueueService;
  private cacheService: CacheService;
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: ((status: SyncStatus) => void)[] = [];
  private lastSyncTime: number | null = null;
  private errors: string[] = [];

  // Configuración
  private readonly SYNC_INTERVAL = 30 * 1000; // 30 segundos
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 5 * 1000; // 5 segundos

  private constructor() {
    this.offlineQueue = OfflineQueueService.getInstance();
    this.cacheService = CacheService.getInstance();
    this.initializeBackgroundSync();
  }

  static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }

  /**
   * Inicializa la sincronización en background
   */
  private initializeBackgroundSync(): void {
    // Escuchar cambios de conectividad
    this.offlineQueue.subscribe((offlineStatus) => {
      if (offlineStatus.isOnline && offlineStatus.queuedOperations > 0) {
        console.log('🔄 Conexión restaurada - iniciando sincronización automática');
        this.startAutoSync();
      } else if (!offlineStatus.isOnline) {
        console.log('📵 Conexión perdida - pausando sincronización automática');
        this.stopAutoSync();
      }
      
      this.notifyListeners();
    });

    // Configurar sincronización periódica
    this.startAutoSync();

    // Registrar Service Worker para sincronización en background (si está disponible)
    this.registerServiceWorkerSync();
  }

  /**
   * Inicia la sincronización automática
   */
  startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, this.SYNC_INTERVAL);

    console.log('🔄 Sincronización automática iniciada');
  }

  /**
   * Detiene la sincronización automática
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    console.log('⏸️ Sincronización automática pausada');
  }

  /**
   * Realiza una sincronización manual
   */
  async performSync(force: boolean = false): Promise<SyncResult> {
    if (this.syncInProgress && !force) {
      console.log('⏳ Sincronización ya en progreso');
      return {
        success: false,
        syncedOperations: 0,
        failedOperations: 0,
        errors: ['Sincronización ya en progreso']
      };
    }

    this.syncInProgress = true;
    this.errors = [];
    this.notifyListeners();

    try {
      console.log('🔄 Iniciando sincronización...');
      
      const pendingOperations = this.offlineQueue.getPendingOperations();
      if (pendingOperations.length === 0) {
        console.log('✅ No hay operaciones pendientes para sincronizar');
        this.lastSyncTime = Date.now();
        return {
          success: true,
          syncedOperations: 0,
          failedOperations: 0,
          errors: []
        };
      }

      let syncedCount = 0;
      let failedCount = 0;
      const syncErrors: string[] = [];

      // Procesar operaciones en lotes para mejor rendimiento
      const batchSize = 5;
      for (let i = 0; i < pendingOperations.length; i += batchSize) {
        const batch = pendingOperations.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(operation => this.syncOperation(operation))
        );

        for (let i = 0; i < batchResults.length; i++) {
          const result = batchResults[i];
          if (result.status === 'fulfilled' && result.value.success) {
            syncedCount++;
          } else {
            failedCount++;
            const error = result.status === 'rejected' 
              ? result.reason 
              : result.value.error;
            syncErrors.push(`Operación ${batch[i].id}: ${error}`);
          }
        }

        // Pequeña pausa entre lotes para no sobrecargar
        if (i + batchSize < pendingOperations.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.lastSyncTime = Date.now();
      this.errors = syncErrors;

      const result: SyncResult = {
        success: failedCount === 0,
        syncedOperations: syncedCount,
        failedOperations: failedCount,
        errors: syncErrors
      };

      console.log(`✅ Sincronización completada: ${syncedCount} exitosas, ${failedCount} fallidas`);
      return result;

    } catch (error) {
      console.error('❌ Error durante sincronización:', error);
      this.errors = [`Error general de sincronización: ${error}`];
      
      return {
        success: false,
        syncedOperations: 0,
        failedOperations: 0,
        errors: this.errors
      };
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  /**
   * Sincroniza una operación específica
   */
  private async syncOperation(operation: QueuedOperation): Promise<{ success: boolean; error?: string }> {
    try {
      switch (operation.type) {
        case 'CREATE_REPORT':
          await this.syncCreatePost(operation);
          break;
        case 'UPDATE_PROFILE':
          await this.syncUpdateProfile(operation);
          break;
        case 'DELETE_REPORT':
          await this.syncDeletePost(operation);
          break;
        default:
          throw new Error(`Tipo de operación no soportado: ${operation.type}`);
      }

      // Remover de la cola si fue exitoso
      this.offlineQueue.removeFromQueue(operation.id);
      
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Error al sincronizar operación ${operation.id}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sincroniza creación de post
   */
  private async syncCreatePost(operation: QueuedOperation): Promise<void> {
    // TODO: Implementar sincronización de posts para SpotShare
    const postData = operation.data as CreatePostData & { userId: string; userName: string };
    
    console.log(`✅ Post sincronizado (demo):`, postData);
  }

  /**
   * Sincroniza actualización de perfil
   */
  private async syncUpdateProfile(operation: QueuedOperation): Promise<void> {
    const { AuthService } = await import('./AuthService');
    const { userId, updates } = operation.data;

    await AuthService.updateProfile(userId, updates);
    console.log(`✅ Perfil sincronizado: ${userId}`);
  }

  /**
   * Sincroniza eliminación de post
   */
  private async syncDeletePost(operation: QueuedOperation): Promise<void> {
    // TODO: Implementar sincronización de eliminación de posts para SpotShare
    const { postId } = operation.data;
    
    console.log(`✅ Post eliminado sincronizado (demo): ${postId}`);
  }

  /**
   * Registra Service Worker para sincronización en background
   */
  private async registerServiceWorkerSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Registrar evento de sincronización
        await (registration as any).sync.register('background-sync');
        console.log('🔄 Service Worker sync registrado');
        
        // Escuchar mensajes del Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'BACKGROUND_SYNC') {
            console.log('🔄 Sincronización en background activada por Service Worker');
            this.performSync();
          }
        });
        
      } catch (error) {
        console.warn('⚠️ No se pudo registrar Service Worker sync:', error);
      }
    }
  }

  /**
   * Programa una sincronización diferida
   */
  async scheduleDeferredSync(delayMs: number = this.RETRY_DELAY): Promise<void> {
    setTimeout(async () => {
      if (this.offlineQueue.getStatus().isOnline) {
        await this.performSync();
      }
    }, delayMs);
  }

  /**
   * Obtiene el estado actual de sincronización
   */
  getStatus(): SyncStatus {
    const offlineStatus = this.offlineQueue.getStatus();
    
    return {
      isActive: this.syncInterval !== null,
      lastSyncTime: this.lastSyncTime,
      pendingOperations: offlineStatus.queuedOperations,
      syncInProgress: this.syncInProgress,
      errors: [...this.errors]
    };
  }

  /**
   * Suscribe un listener para cambios de estado
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Enviar estado inicial
    listener(this.getStatus());
    
    // Retornar función para desuscribirse
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifica a todos los listeners sobre cambios de estado
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error en listener de sincronización:', error);
      }
    });
  }

  /**
   * Limpia recursos y detiene la sincronización
   */
  destroy(): void {
    this.stopAutoSync();
    this.listeners = [];
    console.log('🗑️ BackgroundSyncService destruido');
  }

  /**
   * Fuerza una sincronización inmediata (útil para testing)
   */
  async forceSyncNow(): Promise<SyncResult> {
    return await this.performSync(true);
  }

  /**
   * Obtiene métricas de rendimiento de sincronización
   */
  getSyncMetrics(): {
    totalOperations: number;
    successRate: number;
    averageSyncTime: number;
    lastErrors: string[];
  } {
    // Implementación básica - en producción se podría usar una base de datos local
    const pendingOps = this.offlineQueue.getPendingOperations();
    
    return {
      totalOperations: pendingOps.length,
      successRate: pendingOps.length === 0 ? 100 : 0, // Simplificado
      averageSyncTime: this.SYNC_INTERVAL,
      lastErrors: this.errors.slice(-5) // Últimos 5 errores
    };
  }
}