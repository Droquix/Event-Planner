'use client';

import React from 'react';

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; border: string; label: string }
> = {
  overdue: {
    bg: '#2a0e17',
    color: '#f87171',
    border: '1px solid rgba(244, 63, 94, 0.4)',
    label: 'OVERDUE',
  },
  at_risk: {
    bg: '#0c2444',
    color: '#38bdf8',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    label: 'AT RISK',
  },
  cancelled: {
    bg: '#18181b',
    color: '#a1a1aa',
    border: '1px solid #27272a',
    label: 'CANCELLED',
  },
  pending: {
    bg: '#131d33',
    color: '#93c5fd',
    border: '1px solid #1e293b',
    label: 'PENDING',
  },
};

/**
 * Renders a color-coded status badge for timeline tasks.
 */
export function StatusBadge({ status }: { status: string }) {
  const norm = status.toLowerCase().replace(/\s+/g, '_');
  const style = STATUS_STYLES[norm] ?? STATUS_STYLES.pending;

  return (
    <span
      role="status"
      aria-label={style.label}
      style={{
        background: style.bg,
        color: style.color,
        border: style.border,
        borderRadius: 9999,
        padding: '2px 10px',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.05em',
        display: 'inline-block',
        textTransform: 'uppercase',
      }}
    >
      {style.label}
    </span>
  );
}
