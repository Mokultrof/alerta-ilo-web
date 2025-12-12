import React from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const classes = [
    'ss-button',
    `ss-button--${variant}`,
    `ss-button--${size}`,
    fullWidth && 'ss-button--full-width',
    loading && 'ss-button--loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="ss-button__spinner" aria-hidden="true">
          <svg className="ss-spinner" viewBox="0 0 24 24">
            <circle
              className="ss-spinner__circle"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            />
          </svg>
        </span>
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="ss-button__icon ss-button__icon--left">
          {icon}
        </span>
      )}
      
      <span className="ss-button__text">{children}</span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="ss-button__icon ss-button__icon--right">
          {icon}
        </span>
      )}
    </button>
  );
};

export default Button;
