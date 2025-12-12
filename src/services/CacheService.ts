import { Post, LatLng } from '../types';

// Tipos para el sistema de caché
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

export interface CacheConfig {
  maxAge: number; // Tiempo de vida en milisegundos
  maxSize: number; // Número máximo de entradas
  version: string; // Versión del caché para invalidación
}

export interface ImageCacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
}

export interface QueryCache {
  key: string;
  posts: Post[];
  bounds?: {
    northEast: LatLng;
    southWest: LatLng;
  };
  timestamp: number;
  expiresAt: number;
}

/**
 * Servicio de caché para optimizar el rendimiento de la aplicación
 * Maneja caché de reportes, imágenes y consultas de Firestore
 */
export class CacheService {
  private static instance: CacheService;
  
  // Configuraciones de caché
  private readonly POSTS_CACHE_KEY = 'spotshare_posts_cache';
  private readonly IMAGES_CACHE_KEY = 'spotshare_images_cache';
  private readonly QUERIES_CACHE_KEY = 'spotshare_queries_cache';
  private readonly USER_POSTS_CACHE_KEY = 'spotshare_user_posts_cache';
  
  // Configuraciones por defecto
  private readonly DEFAULT_CACHE_CONFIG: CacheConfig = {
    maxAge: 5 * 60 * 1000, // 5 minutos
    maxSize: 1000,
    version: '1.0.0'
  };

  private readonly POSTS_CONFIG: CacheConfig = {
    maxAge: 2 * 60 * 1000, // 2 minutos para posts
    maxSize: 500,
    version: '1.0.0'
  };

  private readonly IMAGES_CONFIG = {
    maxAge: 24 * 60 * 60 * 1000, // 24 horas para imágenes
    maxSize: 50 * 1024 * 1024, // 50MB máximo
    maxEntries: 100
  };

  private readonly QUERIES_CONFIG: CacheConfig = {
    maxAge: 1 * 60 * 1000, // 1 minuto para consultas
    maxSize: 50,
    version: '1.0.0'
  };

  private constructor() {
    this.initializeCache();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Inicializa el sistema de caché
   */
  private initializeCache(): void {
    // Limpiar cachés expirados al inicializar
    this.cleanExpiredEntries();
    
    // Configurar limpieza periódica
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 5 * 60 * 1000); // Cada 5 minutos
  }

  // ==================== CACHÉ DE POSTS ====================

  /**
   * Guarda posts en caché
   */
  cachePosts(posts: Post[], cacheKey: string = 'all_posts'): void {
    try {
      const cacheEntry: CacheEntry<Post[]> = {
        data: posts,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.POSTS_CONFIG.maxAge,
        version: this.POSTS_CONFIG.version
      };

      const cache = this.getPostsCache();
      cache[cacheKey] = cacheEntry;
      
      // Limitar tamaño del caché
      this.limitCacheSize(cache, this.POSTS_CONFIG.maxSize);
      
      localStorage.setItem(this.POSTS_CACHE_KEY, JSON.stringify(cache));
      console.log(`📦 Posts guardados en caché: ${posts.length} posts (${cacheKey})`);
    } catch (error) {
      console.error('Error al guardar posts en caché:', error);
    }
  }

  /**
   * Obtiene posts del caché
   */
  getCachedPosts(cacheKey: string = 'all_posts'): Post[] | null {
    try {
      const cache = this.getPostsCache();
      const entry = cache[cacheKey];
      
      if (!entry) return null;
      
      // Verificar si ha expirado
      if (Date.now() > entry.expiresAt) {
        delete cache[cacheKey];
        localStorage.setItem(this.POSTS_CACHE_KEY, JSON.stringify(cache));
        return null;
      }
      
      // Verificar versión
      if (entry.version !== this.POSTS_CONFIG.version) {
        delete cache[cacheKey];
        localStorage.setItem(this.POSTS_CACHE_KEY, JSON.stringify(cache));
        return null;
      }
      
      console.log(`📦 Posts obtenidos del caché: ${entry.data.length} posts (${cacheKey})`);
      return entry.data;
    } catch (error) {
      console.error('Error al obtener posts del caché:', error);
      return null;
    }
  }

  /**
   * Guarda posts de usuario en caché
   */
  cacheUserPosts(userId: string, posts: Post[]): void {
    this.cachePosts(posts, `user_${userId}`);
  }

  /**
   * Obtiene posts de usuario del caché
   */
  getCachedUserPosts(userId: string): Post[] | null {
    return this.getCachedPosts(`user_${userId}`);
  }

  /**
   * Invalida caché de posts
   */
  invalidatePostsCache(cacheKey?: string): void {
    try {
      if (cacheKey) {
        const cache = this.getPostsCache();
        delete cache[cacheKey];
        localStorage.setItem(this.POSTS_CACHE_KEY, JSON.stringify(cache));
        console.log(`🗑️ Caché invalidado: ${cacheKey}`);
      } else {
        localStorage.removeItem(this.POSTS_CACHE_KEY);
        console.log('🗑️ Todo el caché de posts invalidado');
      }
    } catch (error) {
      console.error('Error al invalidar caché de posts:', error);
    }
  }

  // ==================== CACHÉ DE IMÁGENES ====================

  /**
   * Guarda imagen en caché
   */
  async cacheImage(url: string): Promise<void> {
    try {
      // No cachear URLs blob (son temporales)
      if (url.startsWith('blob:')) {
        console.warn('⚠️ No se pueden cachear URLs blob, solo URLs de Firebase Storage');
        return;
      }

      // Verificar si ya está en caché
      if (this.getCachedImageBlob(url)) {
        return;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      
      const imageEntry: ImageCacheEntry = {
        url,
        blob,
        timestamp: Date.now(),
        size: blob.size
      };

      const cache = this.getImagesCache();
      cache[url] = imageEntry;
      
      // Verificar límites de tamaño
      this.limitImageCacheSize(cache);
      
      // Guardar en IndexedDB para mejor rendimiento con blobs
      await this.saveImageToIndexedDB(url, imageEntry);
      
      console.log(`🖼️ Imagen guardada en caché: ${url} (${this.formatBytes(blob.size)})`);
    } catch (error) {
      console.error('Error al guardar imagen en caché:', error);
    }
  }

  /**
   * Obtiene imagen del caché como blob
   */
  getCachedImageBlob(url: string): Blob | null {
    try {
      const cache = this.getImagesCache();
      const entry = cache[url];
      
      if (!entry) return null;
      
      // Verificar si ha expirado
      if (Date.now() - entry.timestamp > this.IMAGES_CONFIG.maxAge) {
        delete cache[url];
        this.deleteImageFromIndexedDB(url);
        return null;
      }
      
      return entry.blob;
    } catch (error) {
      console.error('Error al obtener imagen del caché:', error);
      return null;
    }
  }

  /**
   * Obtiene URL de imagen desde caché
   */
  getCachedImageUrl(url: string): string | null {
    const blob = this.getCachedImageBlob(url);
    if (!blob) return null;
    
    return URL.createObjectURL(blob);
  }

  // ==================== CACHÉ DE CONSULTAS ====================

  /**
   * Guarda resultado de consulta en caché
   */
  cacheQuery(queryKey: string, posts: Post[], bounds?: { northEast: LatLng; southWest: LatLng }): void {
    try {
      const queryEntry: QueryCache = {
        key: queryKey,
        posts,
        bounds,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.QUERIES_CONFIG.maxAge
      };

      const cache = this.getQueriesCache();
      cache[queryKey] = queryEntry;
      
      this.limitCacheSize(cache, this.QUERIES_CONFIG.maxSize);
      
      localStorage.setItem(this.QUERIES_CACHE_KEY, JSON.stringify(cache));
      console.log(`🔍 Consulta guardada en caché: ${queryKey} (${posts.length} posts)`);
    } catch (error) {
      console.error('Error al guardar consulta en caché:', error);
    }
  }

  /**
   * Obtiene resultado de consulta del caché
   */
  getCachedQuery(queryKey: string): Post[] | null {
    try {
      const cache = this.getQueriesCache();
      const entry = cache[queryKey];
      
      if (!entry) return null;
      
      if (Date.now() > entry.expiresAt) {
        delete cache[queryKey];
        localStorage.setItem(this.QUERIES_CACHE_KEY, JSON.stringify(cache));
        return null;
      }
      
      console.log(`🔍 Consulta obtenida del caché: ${queryKey} (${entry.posts.length} posts)`);
      return entry.posts;
    } catch (error) {
      console.error('Error al obtener consulta del caché:', error);
      return null;
    }
  }

  // ==================== UTILIDADES PRIVADAS ====================

  private getPostsCache(): Record<string, CacheEntry<Post[]>> {
    try {
      const cached = localStorage.getItem(this.POSTS_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  private getImagesCache(): Record<string, ImageCacheEntry> {
    try {
      const cached = localStorage.getItem(this.IMAGES_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  private getQueriesCache(): Record<string, QueryCache> {
    try {
      const cached = localStorage.getItem(this.QUERIES_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  private limitCacheSize<T>(cache: Record<string, T>, maxSize: number): void {
    const entries = Object.entries(cache);
    if (entries.length > maxSize) {
      // Remover las entradas más antiguas
      const sortedEntries = entries.sort((a, b) => {
        const aTime = (a[1] as any).timestamp || 0;
        const bTime = (b[1] as any).timestamp || 0;
        return aTime - bTime;
      });
      
      const toRemove = sortedEntries.slice(0, entries.length - maxSize);
      toRemove.forEach(([key]) => delete cache[key]);
    }
  }

  private limitImageCacheSize(cache: Record<string, ImageCacheEntry>): void {
    const entries = Object.values(cache);
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    
    if (totalSize > this.IMAGES_CONFIG.maxSize || entries.length > this.IMAGES_CONFIG.maxEntries) {
      // Ordenar por timestamp (más antiguos primero)
      const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
      
      let currentSize = totalSize;
      let currentCount = entries.length;
      
      for (const entry of sortedEntries) {
        if (currentSize <= this.IMAGES_CONFIG.maxSize && currentCount <= this.IMAGES_CONFIG.maxEntries) {
          break;
        }
        
        delete cache[entry.url];
        this.deleteImageFromIndexedDB(entry.url);
        currentSize -= entry.size;
        currentCount--;
      }
    }
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    
    // Limpiar posts expirados
    const postsCache = this.getPostsCache();
    Object.keys(postsCache).forEach(key => {
      if (now > postsCache[key].expiresAt) {
        delete postsCache[key];
      }
    });
    localStorage.setItem(this.POSTS_CACHE_KEY, JSON.stringify(postsCache));
    
    // Limpiar imágenes expiradas
    const imagesCache = this.getImagesCache();
    Object.keys(imagesCache).forEach(key => {
      if (now - imagesCache[key].timestamp > this.IMAGES_CONFIG.maxAge) {
        delete imagesCache[key];
        this.deleteImageFromIndexedDB(key);
      }
    });
    localStorage.setItem(this.IMAGES_CACHE_KEY, JSON.stringify(imagesCache));
    
    // Limpiar consultas expiradas
    const queriesCache = this.getQueriesCache();
    Object.keys(queriesCache).forEach(key => {
      if (now > queriesCache[key].expiresAt) {
        delete queriesCache[key];
      }
    });
    localStorage.setItem(this.QUERIES_CACHE_KEY, JSON.stringify(queriesCache));
  }

  // ==================== INDEXEDDB PARA IMÁGENES ====================

  private async saveImageToIndexedDB(url: string, entry: ImageCacheEntry): Promise<void> {
    // Implementación simplificada - en producción usar una librería como Dexie
    try {
      const request = indexedDB.open('AlertaIloImageCache', 1);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'url' });
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        store.put(entry);
      };
    } catch (error) {
      console.error('Error al guardar imagen en IndexedDB:', error);
    }
  }

  private async deleteImageFromIndexedDB(url: string): Promise<void> {
    try {
      const request = indexedDB.open('AlertaIloImageCache', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        store.delete(url);
      };
    } catch (error) {
      console.error('Error al eliminar imagen de IndexedDB:', error);
    }
  }

  // ==================== UTILIDADES PÚBLICAS ====================

  /**
   * Limpia todo el caché
   */
  clearAllCache(): void {
    localStorage.removeItem(this.POSTS_CACHE_KEY);
    localStorage.removeItem(this.IMAGES_CACHE_KEY);
    localStorage.removeItem(this.QUERIES_CACHE_KEY);
    localStorage.removeItem(this.USER_POSTS_CACHE_KEY);
    
    // Limpiar IndexedDB
    indexedDB.deleteDatabase('SpotShareImageCache');
    
    console.log('🗑️ Todo el caché limpiado');
  }

  /**
   * Obtiene estadísticas del caché
   */
  getCacheStats(): {
    posts: { entries: number; size: string };
    images: { entries: number; size: string };
    queries: { entries: number; size: string };
  } {
    const postsCache = this.getPostsCache();
    const imagesCache = this.getImagesCache();
    const queriesCache = this.getQueriesCache();
    
    const imageSize = Object.values(imagesCache).reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      posts: {
        entries: Object.keys(postsCache).length,
        size: this.formatBytes(JSON.stringify(postsCache).length)
      },
      images: {
        entries: Object.keys(imagesCache).length,
        size: this.formatBytes(imageSize)
      },
      queries: {
        entries: Object.keys(queriesCache).length,
        size: this.formatBytes(JSON.stringify(queriesCache).length)
      }
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}