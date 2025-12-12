// Tipos para métricas de rendimiento
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'loading' | 'rendering' | 'network' | 'cache' | 'user-interaction';
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    averageLoadTime: number;
    cacheHitRate: number;
    networkRequests: number;
    renderTime: number;
    memoryUsage: number;
  };
  recommendations: string[];
}

/**
 * Servicio de monitoreo de rendimiento para optimizar la aplicación
 */
export class PerformanceMonitorService {
  private static instance: PerformanceMonitorService;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private readonly MAX_METRICS = 1000; // Límite de métricas almacenadas

  private constructor() {
    this.initializePerformanceMonitoring();
  }

  static getInstance(): PerformanceMonitorService {
    if (!PerformanceMonitorService.instance) {
      PerformanceMonitorService.instance = new PerformanceMonitorService();
    }
    return PerformanceMonitorService.instance;
  }

  /**
   * Inicializa el monitoreo de rendimiento
   */
  private initializePerformanceMonitoring(): void {
    // Monitorear Web Vitals
    this.observeWebVitals();
    
    // Monitorear navegación
    this.observeNavigation();
    
    // Monitorear recursos
    this.observeResources();
    
    // Monitorear memoria (si está disponible)
    this.observeMemory();
    
    // Limpiar métricas antiguas periódicamente
    setInterval(() => {
      this.cleanOldMetrics();
    }, 5 * 60 * 1000); // Cada 5 minutos
  }

  /**
   * Observa Web Vitals (Core Web Vitals)
   */
  private observeWebVitals(): void {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.addMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          timestamp: Date.now(),
          category: 'loading',
          metadata: { 
            element: (lastEntry as any).element?.tagName,
            url: (lastEntry as any).url 
          }
        });
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer no soportado:', error);
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.addMetric({
            name: 'FID',
            value: (entry as any).processingStart - entry.startTime,
            timestamp: Date.now(),
            category: 'user-interaction',
            metadata: { 
              eventType: (entry as any).name 
            }
          });
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer no soportado:', error);
      }

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });

        if (clsValue > 0) {
          this.addMetric({
            name: 'CLS',
            value: clsValue,
            timestamp: Date.now(),
            category: 'rendering'
          });
        }
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer no soportado:', error);
      }
    }
  }

  /**
   * Observa métricas de navegación
   */
  private observeNavigation(): void {
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const navEntry = entry as PerformanceNavigationTiming;
          
          // Tiempo de carga total
          this.addMetric({
            name: 'Page Load Time',
            value: navEntry.loadEventEnd - navEntry.fetchStart,
            timestamp: Date.now(),
            category: 'loading'
          });

          // Tiempo de respuesta del servidor
          this.addMetric({
            name: 'Server Response Time',
            value: navEntry.responseStart - navEntry.requestStart,
            timestamp: Date.now(),
            category: 'network'
          });

          // Tiempo de renderizado
          this.addMetric({
            name: 'Render Time',
            value: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            timestamp: Date.now(),
            category: 'rendering'
          });
        });
      });

      try {
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('Navigation observer no soportado:', error);
      }
    }
  }

  /**
   * Observa carga de recursos
   */
  private observeResources(): void {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Tiempo de carga de recursos
          this.addMetric({
            name: 'Resource Load Time',
            value: resourceEntry.responseEnd - resourceEntry.startTime,
            timestamp: Date.now(),
            category: 'network',
            metadata: {
              name: resourceEntry.name,
              type: resourceEntry.initiatorType,
              size: resourceEntry.transferSize,
              cached: resourceEntry.transferSize === 0
            }
          });
        });
      });

      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer no soportado:', error);
      }
    }
  }

  /**
   * Observa uso de memoria
   */
  private observeMemory(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory;
        
        this.addMetric({
          name: 'Memory Usage',
          value: memInfo.usedJSHeapSize,
          timestamp: Date.now(),
          category: 'rendering',
          metadata: {
            total: memInfo.totalJSHeapSize,
            limit: memInfo.jsHeapSizeLimit,
            percentage: (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100
          }
        });
      }, 30000); // Cada 30 segundos
    }
  }

  /**
   * Agrega una métrica personalizada
   */
  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Mantener solo las métricas más recientes
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log de métricas importantes
    if (metric.category === 'loading' && metric.value > 3000) {
      console.warn(`⚠️ Tiempo de carga lento detectado: ${metric.name} = ${metric.value}ms`);
    }
  }

  /**
   * Mide el tiempo de ejecución de una función
   */
  async measureFunction<T>(
    name: string, 
    fn: () => Promise<T> | T,
    category: PerformanceMetric['category'] = 'user-interaction'
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const endTime = performance.now();
      
      this.addMetric({
        name,
        value: endTime - startTime,
        timestamp: Date.now(),
        category,
        metadata: { success: true }
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      this.addMetric({
        name,
        value: endTime - startTime,
        timestamp: Date.now(),
        category,
        metadata: { success: false, error: (error as Error).message }
      });
      
      throw error;
    }
  }

  /**
   * Marca el inicio de una operación
   */
  markStart(name: string): void {
    performance.mark(`${name}-start`);
  }

  /**
   * Marca el fin de una operación y calcula la duración
   */
  markEnd(name: string, category: PerformanceMetric['category'] = 'user-interaction'): void {
    const endMark = `${name}-end`;
    performance.mark(endMark);
    
    try {
      performance.measure(name, `${name}-start`, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      
      this.addMetric({
        name,
        value: measure.duration,
        timestamp: Date.now(),
        category
      });
      
      // Limpiar marcas
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
    } catch (error) {
      console.warn(`No se pudo medir ${name}:`, error);
    }
  }

  /**
   * Obtiene métricas filtradas por categoría
   */
  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.category === category);
  }

  /**
   * Obtiene métricas de los últimos N minutos
   */
  getRecentMetrics(minutes: number = 5): PerformanceMetric[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  /**
   * Genera un reporte de rendimiento
   */
  generateReport(): PerformanceReport {
    const recentMetrics = this.getRecentMetrics(10); // Últimos 10 minutos
    
    // Calcular promedios
    const loadingMetrics = recentMetrics.filter(m => m.category === 'loading');
    const networkMetrics = recentMetrics.filter(m => m.category === 'network');
    const renderingMetrics = recentMetrics.filter(m => m.category === 'rendering');
    const cacheMetrics = recentMetrics.filter(m => m.metadata?.cached !== undefined);
    
    const averageLoadTime = loadingMetrics.length > 0 
      ? loadingMetrics.reduce((sum, m) => sum + m.value, 0) / loadingMetrics.length 
      : 0;
    
    const cacheHitRate = cacheMetrics.length > 0
      ? (cacheMetrics.filter(m => m.metadata?.cached).length / cacheMetrics.length) * 100
      : 0;
    
    const averageRenderTime = renderingMetrics.length > 0
      ? renderingMetrics.reduce((sum, m) => sum + m.value, 0) / renderingMetrics.length
      : 0;
    
    const memoryMetrics = recentMetrics.filter(m => m.name === 'Memory Usage');
    const currentMemory = memoryMetrics.length > 0 ? memoryMetrics[memoryMetrics.length - 1].value : 0;

    // Generar recomendaciones
    const recommendations: string[] = [];
    
    if (averageLoadTime > 3000) {
      recommendations.push('Optimizar tiempo de carga - considerar lazy loading y compresión de imágenes');
    }
    
    if (cacheHitRate < 50) {
      recommendations.push('Mejorar estrategia de caché para reducir solicitudes de red');
    }
    
    if (averageRenderTime > 100) {
      recommendations.push('Optimizar renderizado - considerar virtualización para listas largas');
    }
    
    if (currentMemory > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Alto uso de memoria - revisar posibles memory leaks');
    }

    return {
      metrics: recentMetrics,
      summary: {
        averageLoadTime,
        cacheHitRate,
        networkRequests: networkMetrics.length,
        renderTime: averageRenderTime,
        memoryUsage: currentMemory
      },
      recommendations
    };
  }

  /**
   * Limpia métricas antiguas
   */
  private cleanOldMetrics(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
    const initialCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
    
    const removedCount = initialCount - this.metrics.length;
    if (removedCount > 0) {
      console.log(`🧹 Limpiadas ${removedCount} métricas antiguas`);
    }
  }

  /**
   * Obtiene estadísticas de rendimiento en tiempo real
   */
  getRealTimeStats(): {
    fps: number;
    memoryUsage: number;
    networkActivity: number;
    cacheEfficiency: number;
  } {
    const recentMetrics = this.getRecentMetrics(1); // Último minuto
    
    // Calcular FPS aproximado basado en métricas de renderizado
    const renderMetrics = recentMetrics.filter(m => m.category === 'rendering');
    const avgRenderTime = renderMetrics.length > 0 
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length 
      : 16.67; // 60 FPS por defecto
    
    const fps = Math.min(60, 1000 / avgRenderTime);
    
    // Uso de memoria actual
    const memoryMetrics = recentMetrics.filter(m => m.name === 'Memory Usage');
    const memoryUsage = memoryMetrics.length > 0 ? memoryMetrics[memoryMetrics.length - 1].value : 0;
    
    // Actividad de red
    const networkMetrics = recentMetrics.filter(m => m.category === 'network');
    const networkActivity = networkMetrics.length;
    
    // Eficiencia de caché
    const cacheMetrics = recentMetrics.filter(m => m.metadata?.cached !== undefined);
    const cacheEfficiency = cacheMetrics.length > 0
      ? (cacheMetrics.filter(m => m.metadata?.cached).length / cacheMetrics.length) * 100
      : 100;

    return {
      fps: Math.round(fps),
      memoryUsage,
      networkActivity,
      cacheEfficiency: Math.round(cacheEfficiency)
    };
  }

  /**
   * Destruye el servicio y limpia recursos
   */
  destroy(): void {
    // Desconectar observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    // Limpiar métricas
    this.metrics = [];
    
    console.log('🗑️ PerformanceMonitorService destruido');
  }
}