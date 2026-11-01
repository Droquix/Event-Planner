'use client';

import React from 'react';

export interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline-pill';
  size?: 'sm' | 'md' | 'lg';
}

interface ButtonConfig {
  bg: string;
  hoverBg: string;
  color: string;
  border: string;
  radius: number;
  fontWeight: number;
  fontSize: number;
}

const BUTTON_CONFIGS: Record<string, ButtonConfig> = {
  primary: {
    bg: '#60a5fa',
    hoverBg: '#3b82f6',
    color: '#070d19',
    border: 'none',
    radius: 8,
    fontWeight: 700,
    fontSize: 13,
  },
  secondary: {
    bg: '#131c31',
    hoverBg: '#1e293b',
    color: '#cbd5e1',
    border: '1px solid #334155',
    radius: 8,
    fontWeight: 500,
    fontSize: 13,
  },
  danger: {
    bg: 'transparent',
    hoverBg: '#2a0e17',
    color: '#f87171',
    border: '1px solid rgba(244, 63, 94, 0.4)',
    radius: 9999,
    fontWeight: 600,
    fontSize: 11,
  },
  'outline-pill': {
    bg: 'transparent',
    hoverBg: '#1e293b',
    color: '#cbd5e1',
    border: '1px solid #334155',
    radius: 9999,
    fontWeight: 500,
    fontSize: 12,
  },
  ghost: {
    bg: 'transparent',
    hoverBg: '#172339',
    color: '#cbd5e1',
    border: '1px solid #1e293b',
    radius: 8,
    fontWeight: 500,
    fontSize: 13,
  },
};

const PADDINGS: Record<'sm' | 'md' | 'lg', string> = {
  sm: '6px 14px',
  md: '8px 18px',
  lg: '10px 24px',
};

/**
 * Reusable design-system button supporting primary, secondary, danger, ghost, and pill variants.
 */
export function Btn({ variant = 'primary', size = 'md', children, style, ...rest }: BtnProps) {
  const [hov, setHov] = React.useState(false);
  const cfg = BUTTON_CONFIGS[variant] ?? BUTTON_CONFIGS.primary;
  const pad = PADDINGS[size];

  return (
    <button
      style={{
        background: hov ? cfg.hoverBg : cfg.bg,
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
