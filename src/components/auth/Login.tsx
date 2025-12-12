import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { KeyboardNavigation, AriaUtils } from '../../utils/accessibility';
import { useTranslation } from '../../hooks/useTranslation';
import './Auth.css';

interface LoginProps {
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const { signIn, signInWithGoogle } = useAuth();
  const { t, getErrorMessage } = useTranslation();

  // Focus on email input when component mounts
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      const errorMsg = t('auth.errors.requiredFields');
      setError(errorMsg);
      // Announce error to screen readers
      AriaUtils.createLiveRegion(errorMsg, 'assertive');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      AriaUtils.createLiveRegion(t('auth.success.loginSuccess'), 'polite');
    } catch (error: any) {
      const errorMsg = getErrorMessage(error.code, error.message);
      setError(errorMsg);
      AriaUtils.createLiveRegion(`${t('common.error')}: ${errorMsg}`, 'assertive');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      AriaUtils.createLiveRegion(t('auth.success.googleLoginSuccess'), 'polite');
    } catch (error: any) {
      const errorMsg = getErrorMessage(error.code, error.message);
      setError(errorMsg);
      AriaUtils.createLiveRegion(`${t('common.error')}: ${errorMsg}`, 'assertive');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    KeyboardNavigation.handleButtonKeyDown(e, action);
  };

  const titleId = AriaUtils.generateId('login-title');
  const errorId = AriaUtils.generateId('login-error');

  return (
    <div className="auth-container">
      <div className="auth-card" role="main" id="main-content">
        <div className="auth-header">
          <h1 id={titleId}>{t('auth.login.title')}</h1>
          <p>{t('auth.login.subtitle')}</p>
        </div>

        {error && (
          <div 
            className="error-message status-error"
            role="alert"
            id={errorId}
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <form 
          onSubmit={handleSubmit} 
          className="auth-form"
          aria-labelledby={titleId}
          aria-describedby={error ? errorId : undefined}
          noValidate
        >
          <div className="form-group">
            <label htmlFor="email" className="required">
              {t('auth.login.email')}
            </label>
            <input
              ref={emailRef}
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.login.emailPlaceholder')}
              disabled={loading}
              required
              aria-required="true"
              aria-invalid={error && !email ? 'true' : 'false'}
              aria-describedby="email-help"
              autoComplete="email"
            />
            <div id="email-help" className="sr-only">
              {t('auth.login.emailHelp')}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="required">
              {t('auth.login.password')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.login.passwordPlaceholder')}
              disabled={loading}
              required
              aria-required="true"
              aria-invalid={error && !password ? 'true' : 'false'}
              aria-describedby="password-help"
              autoComplete="current-password"
            />
            <div id="password-help" className="sr-only">
              {t('auth.login.passwordHelp')}
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={loading}
            aria-describedby="submit-help"
          >
            {loading ? (
              <>
                <span className="loading" aria-hidden="true"></span>
                {t('auth.login.submittingButton')}
              </>
            ) : (
              t('auth.login.submitButton')
            )}
          </button>
          <div id="submit-help" className="sr-only">
            {t('auth.login.submitHelp')}
          </div>
        </form>

        <div className="auth-divider" role="separator" aria-label={t('common.or')}>
          <span>{t('common.or')}</span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          onKeyDown={(e) => handleKeyDown(e, handleGoogleSignIn)}
          className="auth-button google"
          disabled={loading}
          aria-label={t('auth.login.googleButton')}
          aria-describedby="google-help"
        >
          <svg 
            className="google-icon" 
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('auth.login.googleButton')}
        </button>
        <div id="google-help" className="sr-only">
          {t('auth.login.googleHelp')}
        </div>

        <div className="auth-footer">
          <p>
            {t('auth.login.switchToRegister').split(' ').slice(0, -2).join(' ')}{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToRegister}
              onKeyDown={(e) => handleKeyDown(e, onSwitchToRegister)}
              aria-label={t('auth.login.switchHelp')}
            >
              {t('auth.login.switchToRegister').split(' ').slice(-2).join(' ')}
            </button>
          </p>
        </div>

        {/* Live region for screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" />
      </div>
    </div>
  );
};

export default Login;