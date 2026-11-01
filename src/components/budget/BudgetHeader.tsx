'use client';

import React from 'react';
import { DownloadIcon } from '../icons';

export interface BudgetHeaderProps {
  occasionText: string;
  cityText: string;
  onExport: () => void;
}

/**
 * Top header banner for Budget tab with export action.
 */
export const BudgetHeader: React.FC<BudgetHeaderProps> = ({
  occasionText,
  cityText,
  onExport,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          FINANCIAL CLARITY
        </p>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: '#ffffff',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
          }}
        >
          Every rupee assigned with purpose.
        </h2>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, maxWidth: 580, lineHeight: 1.5 }}>
          A dynamic allocation calibrated for {occasionText} in {cityText}. Adjust guests or budget anytime.
        </p>
      </div>

      <button
        type="button"
        onClick={onExport}
        style={{
          background: '#131c31',
          border: '1px solid #1e293b',
          borderRadius: 8,
          padding: '8px 14px',
          color: '#cbd5e1',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#131c31')}
      >
        <DownloadIcon size={14} color="#94a3b8" />
        <span>Export Plan</span>
      </button>
    </div>
  );
};
