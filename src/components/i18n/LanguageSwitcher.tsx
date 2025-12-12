import React from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardNavigation, AriaUtils } from '../../utils/accessibility';
import './LanguageSwitcher.css';

interface LanguageSwitcherProps {
  compact?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const _currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    
    // Announce language change to screen readers
    const languageName = languages.find(lang => lang.code === languageCode)?.name;
    AriaUtils.createLiveRegion(
      `Idioma cambiado a ${languageName}`, 
      'polite'
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent, languageCode: string) => {
    KeyboardNavigation.handleButtonKeyDown(e, () => handleLanguageChange(languageCode));
  };

  if (compact) {
    return (
      <div className="language-switcher compact">
        <select
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          aria-label="Seleccionar idioma"
          className="language-select"
        >
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.flag} {language.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="language-switcher" role="group" aria-label="Selector de idioma">
      <span className="language-label">
        <span className="decorative-icon" aria-hidden="true">🌐</span>
        <span className="icon-text">Idioma:</span>
      </span>
      
      <div className="language-options">
        {languages.map((language) => (
          <button
            key={language.code}
            className={`language-option ${i18n.language === language.code ? 'active' : ''}`}
            onClick={() => handleLanguageChange(language.code)}
            onKeyDown={(e) => handleKeyDown(e, language.code)}
            aria-pressed={i18n.language === language.code}
            aria-label={`Cambiar idioma a ${language.name}`}
            title={`Cambiar idioma a ${language.name}`}
          >
            <span className="language-flag" aria-hidden="true">{language.flag}</span>
            <span className="language-name">{language.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;