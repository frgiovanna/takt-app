import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  style,
  className = '',
  id,
  ...props
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
    width: '100%',
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family)',
    fontSize: '15px',
    background: 'var(--bg-input)',
    border: error ? '1px solid var(--color-nada)' : '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    padding: '12px 16px',
    outline: 'none',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: error ? 'var(--color-nada)' : 'var(--text-secondary)',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--color-nada)',
    marginTop: '4px',
  };

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={containerStyle} className={`ds-input-container ${className}`}>
      {label && <label htmlFor={inputId} style={labelStyle}>{label}</label>}
      <input
        id={inputId}
        style={inputStyle}
        className="ds-input-element"
        {...props}
      />
      <style>{`
        .ds-input-element:focus {
          border-color: var(--border-color-active) !important;
          box-shadow: 0 0 0 3px var(--color-primary-glow) !important;
        }
      `}</style>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
};
