/**
 * Shared, accessible UI primitives used across all tabs.
 */
'use client';

import React from 'react';

// ── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'ok' | 'overdue' | 'at_risk' | 'cancelled' | 'pending' | 'in_progress';

const BADGE_STYLES: Record<BadgeVariant, { bg: string; text: string; label: string }> = {
  ok:          { bg: '#14532d', text: '#86efac', label: 'OK' },
  pending:     { bg: '#1e3a5f', text: '#93c5fd', label: 'Pending' },
  in_progress: { bg: '#1c3350', text: '#7dd3fc', label: 'In Progress' },
  overdue:     { bg: '#4c0519', text: '#fda4af', label: 'Overdue' },
  at_risk:     { bg: '#451a03', text: '#fde68a', label: 'At Risk' },
  cancelled:   { bg: '#27272a', text: '#a1a1aa', label: 'Cancelled' },
};

export function StatusBadge({ status }: { status: string }) {
  const v = (status as BadgeVariant) in BADGE_STYLES ? (status as BadgeVariant) : 'pending';
  const s = BADGE_STYLES[v];
  return (
    <span
      role="status"
      aria-label={s.label}
      style={{
        background: s.bg,
        color: s.text,
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
        display: 'inline-block',
        textTransform: 'uppercase',
      }}
    >
      {s.label}
    </span>
  );
}

// ── Warning banner ───────────────────────────────────────────────────────────

export function WarningList({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  return (
    <ul
      role="list"
      aria-label="Warnings"
      style={{
        margin: '0 0 16px',
        padding: '12px 16px',
        background: '#431407',
        border: '1px solid #7c2d12',
        borderRadius: 10,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {warnings.map((w, i) => (
        <li key={i} style={{ color: '#fde68a', fontSize: 13, display: 'flex', gap: 8 }}>
          <span aria-hidden>⚠️</span>
          <span>{w}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Field label + input ──────────────────────────────────────────────────────

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  helpText?: string;
}

export function Field({ id, label, helpText, ...rest }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        htmlFor={id}
        style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}
      >
        {label}
      </label>
      <input
        id={id}
        aria-describedby={helpText ? `${id}-help` : undefined}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: '8px 12px',
          color: '#f8fafc',
          fontSize: 14,
          outline: 'none',
          width: '100%',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
        onBlur={(e) => (e.target.style.borderColor = '#334155')}
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

// ── Select field ─────────────────────────────────────────────────────────────

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  children: React.ReactNode;
}

export function SelectField({ id, label, children, ...rest }: SelectFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>
        {label}
      </label>
      <select
        id={id}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: '8px 12px',
          color: '#f8fafc',
          fontSize: 14,
          outline: 'none',
          width: '100%',
          cursor: 'pointer',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
        onBlur={(e) => (e.target.style.borderColor = '#334155')}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export function Btn({ variant = 'primary', size = 'md', children, style, ...rest }: BtnProps) {
  const bg: Record<string, string> = {
    primary:   '#0ea5e9',
    secondary: '#334155',
    danger:    '#e11d48',
    ghost:     'transparent',
  };
  const hover: Record<string, string> = {
    primary:   '#0284c7',
    secondary: '#475569',
    danger:    '#be123c',
    ghost:     '#1e293b',
  };
  const [hov, setHov] = React.useState(false);
  return (
    <button
      style={{
        background: hov ? hover[variant] : bg[variant],
        color: variant === 'ghost' ? '#94a3b8' : '#fff',
        border: variant === 'ghost' ? '1px solid #334155' : 'none',
        borderRadius: 8,
        padding: size === 'sm' ? '5px 12px' : '8px 18px',
        fontSize: size === 'sm' ? 12 : 14,
        fontWeight: 600,
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        opacity: rest.disabled ? 0.5 : 1,
        transition: 'background 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
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

// ── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 12,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 16,
        fontWeight: 700,
        color: '#e2e8f0',
        marginBottom: 16,
        borderBottom: '1px solid #334155',
        paddingBottom: 8,
      }}
    >
      {children}
    </h2>
  );
}

// ── Live region for a11y announcements ───────────────────────────────────────

export function LiveRegion({ message }: { message: string }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        border: 0,
      }}
    >
      {message}
    </div>
  );
}

// ── Currency formatter ────────────────────────────────────────────────────────

export function fmt(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}
