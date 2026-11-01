'use client';

import React from 'react';

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
