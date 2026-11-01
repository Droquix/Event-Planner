'use client';

import React from 'react';

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  helpText?: string;
}

/**
 * Accessible text or number input with integrated label, help text, and focus states.
 */
export function Field({ id, label, helpText, style, ...rest }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>
        {label}
      </label>
      <input
        id={id}
        aria-describedby={helpText ? `${id}-help` : undefined}
        style={{
          background: '#070d19',
          border: '1px solid #1e293b',
          borderRadius: 8,
          padding: '10px 14px',
          color: '#f8fafc',
          fontSize: 13,
          outline: 'none',
          width: '100%',
          transition: 'border-color 0.15s',
          ...style,
        }}
        onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
        onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
        {...rest}
      />
      {helpText && (
        <span id={`${id}-help`} style={{ fontSize: 11, color: '#64748b' }}>
          {helpText}
        </span>
      )}
    </div>
  );
}
