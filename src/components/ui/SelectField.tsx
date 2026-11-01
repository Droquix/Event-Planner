'use client';

import React from 'react';

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  children: React.ReactNode;
}

/**
 * Custom styled dropdown select element with accessible label and custom arrow indicator.
 */
export function SelectField({ id, label, children, style, ...rest }: SelectFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          id={id}
          style={{
            background: '#070d19',
            border: '1px solid #1e293b',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#f8fafc',
            fontSize: 13,
            outline: 'none',
            width: '100%',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            paddingRight: 32,
            ...style,
          }}
          onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
          onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
          {...rest}
        >
          {children}
        </select>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#64748b',
            fontSize: 11,
          }}
        >
          ▼
        </span>
      </div>
    </div>
  );
}
