import React from 'react';
import { Card } from '../ui';
import { SlidersIcon } from '../icons';

export interface BudgetSlidersCardProps {
  guests: string;
  budget: string;
  error: string;
  onGuestsChange: (val: string) => void;
  onBudgetChange: (val: string) => void;
  onRecalculate: () => void;
}

export const BudgetSlidersCard: React.FC<BudgetSlidersCardProps> = ({
  guests,
  budget,
  error,
  onGuestsChange,
  onBudgetChange,
  onRecalculate,
}) => {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div
          style={{
            background: '#172339',
            color: '#38bdf8',
            width: 32,
            height: 32,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <SlidersIcon size={16} color="#38bdf8" />
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Adjust budget &amp; guests
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
            Keep your recommendation set in sync.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 220px' }}>
          <label htmlFor="adj-guests" style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1' }}>
            Guest count
          </label>
          <input
            id="adj-guests"
            type="number"
            min={1}
            value={guests}
            onChange={(e) => onGuestsChange(e.target.value)}
            style={{
              background: '#070d19',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: 13,
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
            onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 280px' }}>
          <label htmlFor="adj-budget" style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1' }}>
            Total budget (₹)
          </label>
          <input
            id="adj-budget"
            type="number"
            min={1}
            value={budget}
            onChange={(e) => onBudgetChange(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'adj-budget-error' : undefined}
            style={{
              background: '#070d19',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: 13,
              outline: 'none',
              minHeight: 44,
            }}
            onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
            onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
          />
        </div>

        <button
          type="button"
          onClick={onRecalculate}
          style={{
            background: '#60a5fa',
            color: '#070d19',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.15s ease',
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#3b82f6')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#60a5fa')}
        >
          Recalculate
        </button>
      </div>

      {error && (
        <p
          id="adj-budget-error"
          role="alert"
          style={{ color: '#fca5a5', fontSize: 12, marginTop: 10 }}
        >
          {error}
        </p>
      )}
    </Card>
  );
};
