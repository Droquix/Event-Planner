'use client';

import React from 'react';

export interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline-pill';
  size?: 'sm' | 'md' | 'lg';
}

function getButtonStyles(variant: BtnProps['variant'], hov: boolean) {
  switch (variant) {
    case 'secondary':
      return {
        bg: hov ? '#1e293b' : '#131c31',
        color: '#cbd5e1',
        border: '1px solid #334155',
        radius: 8,
        fontWeight: 500,
        fontSize: 13,
      };
    case 'danger':
      return {
        bg: hov ? '#2a0e17' : 'transparent',
        color: '#f87171',
        border: '1px solid rgba(244, 63, 94, 0.4)',
        radius: 9999,
        fontWeight: 600,
        fontSize: 11,
      };
    case 'outline-pill':
      return {
        bg: hov ? '#1e293b' : 'transparent',
        color: '#cbd5e1',
        border: '1px solid #334155',
        radius: 9999,
        fontWeight: 500,
        fontSize: 12,
      };
    case 'ghost':
      return {
        bg: hov ? '#172339' : 'transparent',
        color: '#cbd5e1',
        border: '1px solid #1e293b',
        radius: 8,
        fontWeight: 500,
        fontSize: 13,
      };
    default:
      return {
        bg: hov ? '#3b82f6' : '#60a5fa',
        color: '#070d19',
        border: 'none',
        radius: 8,
        fontWeight: 700,
        fontSize: 13,
      };
  }
}

/**
 * Reusable design-system button supporting primary, secondary, danger, ghost, and pill variants.
 */
export function Btn({ variant = 'primary', size = 'md', children, style, ...rest }: BtnProps) {
  const [hov, setHov] = React.useState(false);
  const cfg = getButtonStyles(variant, hov);
  const pad = size === 'sm' ? '6px 14px' : size === 'lg' ? '10px 24px' : '8px 18px';

  return (
    <button
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: cfg.border,
        borderRadius: cfg.radius,
        padding: pad,
        fontSize: size === 'sm' ? 12 : cfg.fontSize,
        fontWeight: cfg.fontWeight,
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        opacity: rest.disabled ? 0.45 : 1,
        transition: 'all 0.15s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        ...style,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      {...rest}
    >
      {children}
    </button>
  );
}
