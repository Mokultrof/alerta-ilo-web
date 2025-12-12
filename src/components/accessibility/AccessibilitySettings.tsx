import React, { useState, useEffect } from 'react';
import AccessibilityService, { AccessibilitySettings as Settings, KeyboardNavigation, AriaUtils } from '../../utils/accessibility';
import { useTranslation } from '../../hooks/useTranslation';
import './AccessibilitySettings.css';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<Settings>(() => 
    AccessibilityService.getInstance().getSettings()
  );
  const [hasChanges, setHasChanges] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const accessibilityService = AccessibilityService.getInstance();
    const unsubscribe = accessibilityService.subscribe(setSettings);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Trap focus when modal opens
      const modal = document.querySelector('.accessibility-modal') as HTMLElement;
      if (modal) {
        const cleanup = AccessibilityService.getInstance().trapFocus(modal);
        return cleanup;
      }
    }
  }, [isOpen]);

  const handleSettingChange = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    AccessibilityService.getInstance().updateSetting(key, value);
    setHasChanges(true);
    
    // Announce changes to screen readers
    const getAnnouncementKey = (key: string, value: any): string => {
      switch (key) {
        case 'highContrast':
          return value ? 'accessibility.settings.announcements.highContrastOn' : 'accessibility.settings.announcements.highContrastOff';
        case 'fontSize':
          return 'accessibility.settings.announcements.fontSizeChanged';
        case 'reducedMotion':
          return value ? 'accessibility.settings.announcements.reducedMotionOn' : 'accessibility.settings.announcements.reducedMotionOff';
        case 'screenReaderEnabled':
          return value ? 'accessibility.settings.announcements.screenReaderOn' : 'accessibility.settings.announcements.screenReaderOff';
        default:
          return '';
      }
    };
    
    const announcementKey = getAnnouncementKey(key, value);
    if (announcementKey) {
      const message = key === 'fontSize' 
        ? t(announcementKey, { size: t(`accessibility.settings.visual.fontSize.${value}`) })
        : t(announcementKey);
      AccessibilityService.getInstance().announceToScreenReader(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === KeyboardNavigation.KEYS.ESCAPE) {
      onClose();
    }
  };

  const handleSave = () => {
    AccessibilityService.getInstance().announceToScreenReader(t('accessibility.settings.announcements.settingsSaved'));
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: Settings = {
      highContrast: false,
      fontSize: 'medium',
      reducedMotion: false,
      screenReaderEnabled: false
    };

    Object.entries(defaultSettings).forEach(([key, value]) => {
      AccessibilityService.getInstance().updateSetting(key as keyof Settings, value);
    });

    AccessibilityService.getInstance().announceToScreenReader(t('accessibility.settings.announcements.settingsReset'));
    setHasChanges(true);
  };

  if (!isOpen) return null;

  const titleId = AriaUtils.generateId('accessibility-title');
  const descId = AriaUtils.generateId('accessibility-desc');

  return (
    <div 
      className="accessibility-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div 
        className="accessibility-modal"
        onKeyDown={handleKeyDown}
      >
        <div className="accessibility-header">
          <h2 id={titleId}>{t('accessibility.settings.title')}</h2>
          <p id={descId}>
            {t('accessibility.settings.subtitle')}
          </p>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label={t('accessibility.settings.close')}
          >
            ✕
          </button>
        </div>

        <div className="accessibility-content">
          <div className="setting-group">
            <h3>Visualización</h3>
            
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                  aria-describedby="high-contrast-desc"
                />
                <span className="setting-title">Modo Alto Contraste</span>
              </label>
              <p id="high-contrast-desc" className="setting-description">
                Aumenta el contraste de colores para mejorar la legibilidad
              </p>
            </div>

            <div className="setting-item">
              <label htmlFor="font-size-select" className="setting-title">
                Tamaño de Fuente
              </label>
              <select
                id="font-size-select"
                value={settings.fontSize}
                onChange={(e) => handleSettingChange('fontSize', e.target.value as Settings['fontSize'])}
                aria-describedby="font-size-desc"
              >
                <option value="small">Pequeño</option>
                <option value="medium">Mediano</option>
                <option value="large">Grande</option>
                <option value="extra-large">Extra Grande</option>
              </select>
              <p id="font-size-desc" className="setting-description">
                Ajusta el tamaño del texto en toda la aplicación
              </p>
            </div>
          </div>

          <div className="setting-group">
            <h3>Movimiento y Animaciones</h3>
            
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
                  aria-describedby="reduced-motion-desc"
                />
                <span className="setting-title">Reducir Movimiento</span>
              </label>
              <p id="reduced-motion-desc" className="setting-description">
                Desactiva animaciones y transiciones para reducir mareos
              </p>
            </div>
          </div>

          <div className="setting-group">
            <h3>Tecnologías Asistivas</h3>
            
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.screenReaderEnabled}
                  onChange={(e) => handleSettingChange('screenReaderEnabled', e.target.checked)}
                  aria-describedby="screen-reader-desc"
                />
                <span className="setting-title">Optimizar para Lector de Pantalla</span>
              </label>
              <p id="screen-reader-desc" className="setting-description">
                Mejora la experiencia con lectores de pantalla y otras tecnologías asistivas
              </p>
            </div>
          </div>

          <div className="setting-group">
            <h3>Información del Sistema</h3>
            <div className="system-info">
              <p><strong>Navegador:</strong> {navigator.userAgent.split(' ')[0]}</p>
              <p><strong>Idioma:</strong> {navigator.language}</p>
              <p><strong>Prefiere movimiento reducido:</strong> {
                window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Sí' : 'No'
              }</p>
              <p><strong>Prefiere alto contraste:</strong> {
                window.matchMedia('(prefers-contrast: high)').matches ? 'Sí' : 'No'
              }</p>
            </div>
          </div>
        </div>

        <div className="accessibility-footer">
          <button
            className="btn btn-secondary"
            onClick={handleReset}
            aria-describedby="reset-desc"
          >
            Restablecer
          </button>
          <p id="reset-desc" className="sr-only">
            Restablece todas las configuraciones a sus valores predeterminados
          </p>
          
          <button
            className="btn btn-primary"
            onClick={handleSave}
            aria-describedby="save-desc"
          >
            {hasChanges ? 'Guardar Cambios' : 'Cerrar'}
          </button>
          <p id="save-desc" className="sr-only">
            Guarda la configuración actual y cierra el diálogo
          </p>
        </div>

        {/* Live region for announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" />
      </div>
    </div>
  );
};

export default AccessibilitySettings;