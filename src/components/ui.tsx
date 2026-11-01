/**
 * Shared, accessible UI primitives matching the exact visual design specs.
 */
'use client';

import React from 'react';

// ── Badges ───────────────────────────────────────────────────────────────────

/**
 * Renders a color-coded status badge for timeline tasks (OVERDUE, AT RISK, CANCELLED, PENDING).
 */
export function StatusBadge({ status }: { status: string }) {
  const norm = status.toLowerCase();
  if (norm === 'overdue') {
    return (
      <span
        role="status"
        aria-label="Overdue"
        style={{
          background: '#2a0e17',
          color: '#f87171',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          borderRadius: 9999,
          padding: '2px 10px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.05em',
          display: 'inline-block',
          textTransform: 'uppercase',
        }}
      >
        OVERDUE
      </span>
    );
  }

  if (norm === 'at_risk' || norm === 'at risk') {
    return (
      <span
        role="status"
        aria-label="At risk"
        style={{
          background: '#0c2444',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: 9999,
          padding: '2px 10px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.05em',
          display: 'inline-block',
          textTransform: 'uppercase',
        }}
      >
        AT RISK
      </span>
    );
  }

  if (norm === 'cancelled') {
    return (
      <span
        role="status"
        aria-label="Cancelled"
        style={{
          background: '#18181b',
          color: '#a1a1aa',
          border: '1px solid #27272a',
          borderRadius: 9999,
          padding: '2px 10px',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.05em',
          display: 'inline-block',
          textTransform: 'uppercase',
        }}
      >
        CANCELLED
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label="Pending"
      style={{
        background: '#131d33',
        color: '#93c5fd',
        border: '1px solid #1e293b',
        borderRadius: 9999,
        padding: '2px 10px',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.05em',
        display: 'inline-block',
        textTransform: 'uppercase',
      }}
    >
      PENDING
    </span>
  );
}

// ── AI Source Badge ─────────────────────────────────────────────────────────

/**
 * Displays an indicator of the AI execution mode ("Live AI", "Demo mode - sample response", or loading).
 */
export function AIBadge({ demo, loading }: { demo?: boolean; loading?: boolean }) {
  if (loading) {
    return (
      <span
        role="status"
        aria-live="polite"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#131c31',
          border: '1px solid #1e293b',
          color: '#93c5fd',
          borderRadius: 9999,
          padding: '4px 14px',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        <span aria-hidden>⏳</span> Analyzing with AI...
      </span>
    );
  }
  if (demo === undefined) return null;
  return demo ? (
    <span
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#131c31',
        color: '#cbd5e1',
        border: '1px solid rgba(51, 65, 85, 0.7)',
        borderRadius: 9999,
        padding: '4px 14px',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      Demo mode - sample response
    </span>
  ) : (
    <span
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#064e3b',
        color: '#6ee7b7',
        border: '1px solid #059669',
        borderRadius: 9999,
        padding: '4px 14px',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      ✨ Live AI
    </span>
  );
}

// ── Warning banner ───────────────────────────────────────────────────────────

/**
 * Accessible warning banner rendering an itemized list of validation or scheduling alerts.
 */
export function WarningList({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  return (
    <ul
      role="list"
      aria-label="Warnings"
      style={{
        margin: '0 0 16px',
        padding: '14px 18px',
        background: 'rgba(244, 63, 94, 0.05)',
        border: '1px solid rgba(244, 63, 94, 0.4)',
        borderRadius: 14,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {warnings.map((w, i) => (
        <li
          key={i}
          style={{
            color: '#fda4af',
            fontSize: 13,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <span aria-hidden style={{ color: '#f43f5e', fontSize: 14 }}>
            ⚠️
          </span>
          <span style={{ lineHeight: 1.5 }}>{w}</span>
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

// ── Select field ─────────────────────────────────────────────────────────────

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
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

// ── Button ───────────────────────────────────────────────────────────────────

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline-pill';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable design-system button supporting primary, secondary, danger, ghost, and pill variants.
 */
export function Btn({ variant = 'primary', size = 'md', children, style, ...rest }: BtnProps) {
  const [hov, setHov] = React.useState(false);

  let bg = '#60a5fa';
  let color = '#070d19';
  let border = 'none';
  let radius = 8;
  let pad = size === 'sm' ? '6px 14px' : size === 'lg' ? '10px 24px' : '8px 18px';
  let fontSize = size === 'sm' ? 12 : 13;
  let fontWeight = 700;

  if (variant === 'secondary') {
    bg = hov ? '#1e293b' : '#131c31';
    color = '#cbd5e1';
    border = '1px solid #334155';
    fontWeight = 500;
  } else if (variant === 'danger') {
    bg = hov ? '#2a0e17' : 'transparent';
    color = '#f87171';
    border = '1px solid rgba(244, 63, 94, 0.4)';
    radius = 9999;
    fontWeight = 600;
    fontSize = 11;
  } else if (variant === 'outline-pill') {
    bg = hov ? '#1e293b' : 'transparent';
    color = '#cbd5e1';
    border = '1px solid #334155';
    radius = 9999;
    fontWeight = 500;
    fontSize = 12;
  } else if (variant === 'ghost') {
    bg = hov ? '#172339' : 'transparent';
    color = '#cbd5e1';
    border = '1px solid #1e293b';
    fontWeight = 500;
  } else {
    // Primary
    bg = hov ? '#3b82f6' : '#60a5fa';
    color = '#070d19';
  }

  return (
    <button
      style={{
        background: bg,
        color,
        border,
        borderRadius: radius,
        padding: pad,
        fontSize,
        fontWeight,
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

// ── Card Container ───────────────────────────────────────────────────────────

/**
 * Standard container card with rounded corners, subtle border, and dark backdrop.
 */
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
        background: '#0d1527',
        border: '1px solid #182235',
        borderRadius: 16,
        padding: '24px',
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Section Heading ──────────────────────────────────────────────────────────

/**
 * Subheading typography element for standardizing section labels.
 */
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: '#f8fafc',
        marginBottom: 16,
      }}
    >
      {children}
    </h2>
  );
}

// ── Live region for a11y announcements ───────────────────────────────────────

/**
 * Visually hidden ARIA live region ensuring screen-reader announcements on dynamic budget updates.
 */
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

/**
 * Formats a numeric Indian Rupee value into a standard ₹ symbol string with locale formatting.
 */
export function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}
