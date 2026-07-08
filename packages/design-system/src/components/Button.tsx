import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  style,
  className = '',
  ...props
}) => {
  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: 'var(--font-family)',
      fontSize: '15px',
      fontWeight: 600,
      padding: '12px 24px',
      borderRadius: 'var(--border-radius-md)',
      border: 'none',
      cursor: 'pointer',
      transition: 'all var(--transition-fast)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      outline: 'none',
    };

    if (props.disabled) {
      return {
        ...base,
        background: 'var(--border-color)',
        color: 'var(--text-muted)',
        cursor: 'not-allowed',
        opacity: 0.6,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...base,
          background: 'var(--color-primary)',
          color: 'var(--bg-main)',
          boxShadow: '0 4px 14px 0 var(--color-primary-glow)',
        };
      case 'secondary':
        return {
          ...base,
          background: 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        };
      case 'danger':
        return {
          ...base,
          background: 'var(--color-nada)',
          color: 'var(--bg-main)',
        };
      case 'ghost':
        return {
          ...base,
          background: 'transparent',
          color: 'var(--text-secondary)',
        };
      default:
        return base;
    }
  };

  return (
    <button
      className={`ds-button ds-button-${variant} ${className}`}
      style={{ ...getStyles(), ...style }}
      {...props}
    >
      <style>{`
        .ds-button:active:not(:disabled) {
          transform: scale(0.96);
        }
        .ds-button-primary:hover:not(:disabled) {
          background: var(--color-primary-hover) !important;
          box-shadow: 0 6px 20px 0 var(--color-primary-glow) !important;
        }
        .ds-button-secondary:hover:not(:disabled) {
          border-color: var(--text-secondary) !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .ds-button-danger:hover:not(:disabled) {
          filter: brightness(1.1) !important;
        }
        .ds-button-ghost:hover:not(:disabled) {
          color: var(--text-primary) !important;
          background: rgba(255, 255, 255, 0.03) !important;
        }
      `}</style>
      {children}
    </button>
  );
};
