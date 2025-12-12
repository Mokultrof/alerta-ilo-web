import React, { useState } from 'react';
import AccessibilitySettings from './AccessibilitySettings';
import { KeyboardNavigation, AriaUtils } from '../../utils/accessibility';
import './AccessibilityButton.css';

const AccessibilityButton: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  const handleClick = () => {
    setShowSettings(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    KeyboardNavigation.handleButtonKeyDown(e, handleClick);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <>
      <button
        className="accessibility-button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={AriaUtils.getAriaLabel('accessibility-settings', 'Abrir configuración de accesibilidad')}
        title="Configuración de Accesibilidad"
      >
        <span className="accessibility-icon" aria-hidden="true">♿</span>
        <span className="accessibility-text">Accesibilidad</span>
      </button>

      <AccessibilitySettings 
        isOpen={showSettings}
        onClose={handleCloseSettings}
      />
    </>
  );
};

export default AccessibilityButton;