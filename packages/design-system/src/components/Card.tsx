import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = "",
  style,
  ...props
}) => {
  const cardStyle: React.CSSProperties = {
    background: "var(--surface-elevated, var(--bg-card))",
    backdropFilter: "var(--backdrop-blur)",
    WebkitBackdropFilter: "var(--backdrop-blur)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--border-radius-lg)",
    boxShadow: "var(--box-shadow-card)",
    padding: "24px",
    transition:
      "transform var(--transition-normal), border-color var(--transition-fast), background var(--transition-fast)",
    animation: "fadeIn 0.5s ease-out",
    ...style,
  };

  const hoverClass = hoverable ? "ds-card-hoverable" : "";

  return (
    <div
      className={`ds-card ${hoverClass} ${className}`}
      style={cardStyle}
      {...props}
    >
      <style>{`
        .ds-card-hoverable:hover {
          transform: translateY(-4px);
          border-color: var(--border-color-active);
          background: var(--surface-soft, var(--bg-card-hover));
          cursor: pointer;
        }
      `}</style>
      {children}
    </div>
  );
};
