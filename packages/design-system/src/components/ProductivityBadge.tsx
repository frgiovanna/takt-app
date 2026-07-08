import React from 'react';

export type ProductivityLevel = 1 | 2 | 3 | 4;

interface ProductivityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level: ProductivityLevel;
  customLabel?: string;
}

const DEFAULT_LABELS: Record<ProductivityLevel, string> = {
  1: 'Nada Produtivo',
  2: 'Pouco Produtivo',
  3: 'Produtivo',
  4: 'Altamente Produtivo',
};

const COLOR_VARIABLES: Record<ProductivityLevel, string> = {
  1: 'var(--color-nada)',
  2: 'var(--color-pouco)',
  3: 'var(--color-produtivo)',
  4: 'var(--color-altamente)',
};

export const ProductivityBadge: React.FC<ProductivityBadgeProps> = ({
  level,
  customLabel,
  style,
  className = '',
  ...props
}) => {
  const color = COLOR_VARIABLES[level];
  const label = customLabel || DEFAULT_LABELS[level];

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
    color: color,
    border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
    transition: 'all var(--transition-fast)',
    ...style,
  };

  return (
    <span
      className={`ds-productivity-badge ds-badge-level-${level} ${className}`}
      style={badgeStyle}
      {...props}
    >
      {label}
    </span>
  );
};
