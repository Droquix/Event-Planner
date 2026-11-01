'use client';

import React from 'react';

/**
 * Displays an indicator of the AI execution mode ("Live AI", "Demo mode", or loading).
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
