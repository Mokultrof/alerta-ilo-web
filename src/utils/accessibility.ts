/**
 * Accessibility utilities for Alerta Ilo
 * Provides functions for screen reader support, keyboard navigation, and high contrast mode
 */

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  reducedMotion: boolean;
  screenReaderEnabled: boolean;
}

class AccessibilityService {
  private static instance: AccessibilityService;
  private settings: AccessibilitySettings;
  private listeners: Set<(settings: AccessibilitySettings) => void> = new Set();

  private constructor() {
    this.settings = this.loadSettings();
    this.applySettings();
    this.setupMediaQueryListeners();
  }

  public static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  private loadSettings(): AccessibilitySettings {
    const saved = localStorage.getItem('alerta-ilo-accessibility');
    const defaults: AccessibilitySettings = {
      highContrast: false,
      fontSize: 'medium',
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      screenReaderEnabled: this.detectScreenReader()
    };

    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch {
        return defaults;
      }
    }

    return defaults;
  }

  private saveSettings(): void {
    localStorage.setItem('alerta-ilo-accessibility', JSON.stringify(this.settings));
  }

  private detectScreenReader(): boolean {
    // Check for common screen reader indicators
    return !!(
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      window.speechSynthesis ||
      document.querySelector('[aria-live]')
    );
  }

  private setupMediaQueryListeners(): void {
    // Listen for system preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      this.updateSetting('reducedMotion', e.matches);
    });

    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    highContrastQuery.addEventListener('change', (e) => {
      this.updateSetting('highContrast', e.matches);
    });
  }

  private applySettings(): void {
    const root = document.documentElement;

    // Apply high contrast mode
    if (this.settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    root.classList.add(`font-${this.settings.fontSize}`);

    // Apply reduced motion
    if (this.settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Apply screen reader optimizations
    if (this.settings.screenReaderEnabled) {
      root.classList.add('screen-reader-enabled');
    } else {
      root.classList.remove('screen-reader-enabled');
    }
  }

  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  public updateSetting<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ): void {
    this.settings[key] = value;
    this.saveSettings();
    this.applySettings();
    this.notifyListeners();
  }

  public subscribe(callback: (settings: AccessibilitySettings) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.getSettings()));
  }

  // Utility methods for components
  public announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  public focusElement(element: HTMLElement, options?: FocusOptions): void {
    if (element && typeof element.focus === 'function') {
      element.focus(options);
    }
  }

  public trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
}

// Keyboard navigation utilities
export const KeyboardNavigation = {
  KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    TAB: 'Tab',
    HOME: 'Home',
    END: 'End'
  },

  isActivationKey(key: string): boolean {
    return key === this.KEYS.ENTER || key === this.KEYS.SPACE;
  },

  isNavigationKey(key: string): boolean {
    return [
      this.KEYS.ARROW_UP,
      this.KEYS.ARROW_DOWN,
      this.KEYS.ARROW_LEFT,
      this.KEYS.ARROW_RIGHT,
      this.KEYS.HOME,
      this.KEYS.END
    ].includes(key);
  },

  handleButtonKeyDown(e: React.KeyboardEvent, onClick: () => void): void {
    if (this.isActivationKey(e.key)) {
      e.preventDefault();
      onClick();
    }
  }
};

// ARIA utilities
export const AriaUtils = {
  generateId(prefix: string = 'alerta-ilo'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  createLiveRegion(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    AccessibilityService.getInstance().announceToScreenReader(message, priority);
  },

  getAriaLabel(element: string, context?: string): string {
    const labels: Record<string, string> = {
      'map': 'Mapa interactivo de Ilo',
      'report-form': 'Formulario para crear nuevo reporte',
      'navigation': 'Navegación principal',
      'user-menu': 'Menú de usuario',
      'search': 'Buscar reportes',
      'filter': 'Filtrar reportes',
      'close': 'Cerrar',
      'submit': 'Enviar',
      'cancel': 'Cancelar'
    };

    const label = labels[element] || element;
    return context ? `${label} - ${context}` : label;
  }
};

export default AccessibilityService;