import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Custom hook that extends react-i18next's useTranslation with additional utilities
 * for date formatting and common translation patterns used in Alerta Ilo
 */
export const useTranslation = () => {
  const { t, i18n, ready } = useI18nTranslation();

  /**
   * Format date according to current locale
   */
  const formatDate = (date: Date, format: 'short' | 'long' | 'withTime' | 'longWithTime' = 'short'): string => {
    const locale = i18n.language === 'es' ? 'es-PE' : 'en-US';
    
    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      short: { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      },
      long: { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      },
      withTime: { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      },
      longWithTime: { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    };

    return new Intl.DateTimeFormat(locale, formatOptions[format]).format(date);
  };

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t('dates.relative.now');
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return t('dates.relative.minutesAgo', { count: diffInMinutes });
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return t('dates.relative.hoursAgo', { count: diffInHours });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return t('dates.relative.daysAgo', { count: diffInDays });
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return t('dates.relative.weeksAgo', { count: diffInWeeks });
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return t('dates.relative.monthsAgo', { count: diffInMonths });
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return t('dates.relative.yearsAgo', { count: diffInYears });
  };

  /**
   * Get translated report category
   */
  const getReportCategory = (category: string): string => {
    return t(`reports.categories.${category}`, category);
  };

  /**
   * Get translated report status
   */
  const getReportStatus = (status: string): string => {
    return t(`reports.status.${status}`, status);
  };

  /**
   * Get current language info
   */
  const getCurrentLanguage = () => {
    const languages = {
      es: { name: 'Español', flag: '🇪🇸', locale: 'es-PE' },
      en: { name: 'English', flag: '🇺🇸', locale: 'en-US' }
    };
    
    return languages[i18n.language as keyof typeof languages] || languages.es;
  };

  /**
   * Check if current language is RTL (for future Arabic support)
   */
  const isRTL = (): boolean => {
    const rtlLanguages = ['ar', 'he', 'fa'];
    return rtlLanguages.includes(i18n.language);
  };

  /**
   * Format numbers according to current locale
   */
  const formatNumber = (number: number): string => {
    const locale = i18n.language === 'es' ? 'es-PE' : 'en-US';
    return new Intl.NumberFormat(locale).format(number);
  };

  /**
   * Get error message with fallback
   */
  const getErrorMessage = (errorKey: string, fallback?: string): string => {
    const errorMessage = t(`errors.${errorKey}`, { defaultValue: '' });
    return errorMessage || fallback || t('errors.unknown');
  };

  return {
    t,
    i18n,
    ready,
    formatDate,
    formatRelativeTime,
    getReportCategory,
    getReportStatus,
    getCurrentLanguage,
    isRTL,
    formatNumber,
    getErrorMessage
  };
};

export default useTranslation;