// import { CreatePostData } from '../types'; // No usado actualmente

// Tipos para la cola offline
export interface QueuedOperation {
  id: string;
  type: 'CREATE_REPORT' | 'UPDATE_PROFILE' | 'DELETE_REPORT';
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  lastOnlineTime: number | null;
  queuedOperations: number;
}

export class OfflineQueueService {
  private static instance: OfflineQueueService;
  private queue: QueuedOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private listeners: ((status: OfflineStatus) => void)[] = [];
  private readonly STORAGE_KEY = 'alerta_ilo_offline_queue';
  private readonly MAX_RETRY_COUNT = 3;
  private processingQueue = false;

  private constructor() {
    this.initializeOfflineDetection();
    this.loadQueueFromStorage();
  }

  static getInstance(): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService();
    }
    return OfflineQueueService.instance;
  }

  /**
   * Inicializa la detección de estado offline/online
   */
  private initializeOfflineDetection(): void {
    // Escuchar eventos de conexión
    window.addEventListener('online', () => {
      console.log('🌐 Conexión restaurada');
      this.isOnline = true;
      this.notifyListeners();
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📵 Conexión perdida - modo offline activado');
      this.isOnline = false;
      this.notifyListeners();
    });

    // Verificar conexión periódicamente
    setInterval(() => {
      this.checkConnectionStatus();
    }, 30000); // Cada 30 segundos
  }

  /**
   * Verifica el estado de la conexión haciendo una petición de prueba
   */
  private async checkConnectionStatus(): Promise<void> {
    try {
      // Hacer una petición pequeña para verificar conectividad
      const _response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      const wasOffline = !this.isOnline;
      this.isOnline = true;
      
      if (wasOffline) {
        console.log('🌐 Conexión detectada - procesando cola offline');
        this.notifyListeners();
        this.processQueue();
      }
    } catch (error) {
      if (this.isOnline) {
        console.log('📵 Pérdida de conexión detectada');
        this.isOnline = false;
        this.notifyListeners();
      }
    }
  }

  /**
   * Carga la cola desde localStorage
   */
  private loadQueueFromStorage(): void {
    try {
      const storedQueue = localStorage.getItem(this.STORAGE_KEY);
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue);
        console.log(`📦 Cola offline cargada: ${this.queue.length} operaciones pendientes`);
      }
    } catch (error) {
      console.error('Error al cargar cola offline:', error);
      this.queue = [];
    }
  }

  /**
   * Guarda la cola en localStorage
   */
  private saveQueueToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error al guardar cola offline:', error);
    }
  }

  /**
   * Agrega una operación a la cola
   */
  addToQueue(type: QueuedOperation['type'], data: any): string {
    const operation: QueuedOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.queue.push(operation);
    this.saveQueueToStorage();
    this.notifyListeners();

    console.log(`📝 Operación agregada a la cola offline: ${type}`);

    // Si estamos online, intentar procesar inmediatamente
    if (this.isOnline) {
      this.processQueue();
    }

    return operation.id;
  }

  /**
   * Procesa la cola de operaciones pendientes
   */
  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.processingQueue || this.queue.length === 0) {
      return;
    }

    this.processingQueue = true;
    console.log(`🔄 Procesando cola offline: ${this.queue.length} operaciones`);

    const operationsToProcess = [...this.queue];
    
    for (const operation of operationsToProcess) {
      try {
        await this.executeOperation(operation);
        
        // Remover operación exitosa de la cola
        this.queue = this.queue.filter(op => op.id !== operation.id);
        console.log(`✅ Operación completada: ${operation.type}`);
        
      } catch (error) {
        console.error(`❌ Error al procesar operación ${operation.type}:`, error);
        
        // Incrementar contador de reintentos
        const queuedOperation = this.queue.find(op => op.id === operation.id);
        if (queuedOperation) {
          queuedOperation.retryCount++;
          
          // Si excede el máximo de reintentos, remover de la cola
          if (queuedOperation.retryCount >= this.MAX_RETRY_COUNT) {
            this.queue = this.queue.filter(op => op.id !== operation.id);
            console.warn(`🗑️ Operación descartada tras ${this.MAX_RETRY_COUNT} intentos: ${operation.type}`);
          }
        }
      }
    }

    this.saveQueueToStorage();
    this.notifyListeners();
    this.processingQueue = false;
  }

  /**
   * Ejecuta una operación específica
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    const { AuthService } = await import('./AuthService');

    switch (operation.type) {
      case 'CREATE_REPORT':
        // TODO: Implementar creación de posts para SpotShare
        console.log('🔄 Creando post:', operation.data);
        break;

      case 'UPDATE_PROFILE':
        const { userId, updates } = operation.data;
        await AuthService.updateProfile(userId, updates);
        break;

      case 'DELETE_REPORT':
        // TODO: Implementar eliminación de posts para SpotShare
        console.log('🔄 Eliminando post:', operation.data);
        break;

      default:
        throw new Error(`Tipo de operación no soportado: ${operation.type}`);
    }
  }

  /**
   * Obtiene el estado actual de la conexión y cola
   */
  getStatus(): OfflineStatus {
    return {
      isOnline: this.isOnline,
      lastOnlineTime: this.isOnline ? Date.now() : null,
      queuedOperations: this.queue.length
    };
  }

  /**
   * Suscribe un listener para cambios de estado
   */
  subscribe(listener: (status: OfflineStatus) => void): () => void {
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
        console.error('Error en listener de estado offline:', error);
      }
    });
  }

  /**
   * Limpia la cola de operaciones
   */
  clearQueue(): void {
    this.queue = [];
    this.saveQueueToStorage();
    this.notifyListeners();
    console.log('🗑️ Cola offline limpiada');
  }

  /**
   * Obtiene las operaciones pendientes
   */
  getPendingOperations(): QueuedOperation[] {
    return [...this.queue];
  }

  /**
   * Remueve una operación específica de la cola
   */
  removeFromQueue(operationId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(op => op.id !== operationId);
    
    if (this.queue.length < initialLength) {
      this.saveQueueToStorage();
      this.notifyListeners();
      return true;
    }
    
    return false;
  }

  /**
   * Fuerza el procesamiento de la cola (útil para testing)
   */
  async forceProcessQueue(): Promise<void> {
    if (this.isOnline) {
      await this.processQueue();
    }
  }
}