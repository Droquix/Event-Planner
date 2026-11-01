import React from 'react';
import { Card, AIBadge } from '../ui';
import { BudgetDifference } from '../../lib/budget';
import { formatInr } from './types';

export interface BudgetTradeoffCardProps {
  differences: BudgetDifference[];
  aiExplanation: string;
  explainLoading: boolean;
  explainDemo?: boolean;
}

export const BudgetTradeoffCard: React.FC<BudgetTradeoffCardProps> = ({
  differences,
  aiExplanation,
  explainLoading,
  explainDemo,
}) => {
  if (differences.length === 0) return null;

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
          What changed and why
        </h3>
        <AIBadge demo={explainDemo} loading={explainLoading} />
      </div>

      {(explainLoading || aiExplanation) && (
        <div
          style={{
            background: '#070d19',
            border: '1px solid #1e293b',
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
              AI Tradeoff Explanation
            </span>
            <AIBadge demo={explainDemo} loading={explainLoading} />
          </div>
          {explainLoading ? (
            <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>
              Analyzing recalculation impact with AI...
            </p>
          ) : (
            <p style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {aiExplanation}
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {differences.map((d, i) => (
          <div
            key={i}
            style={{
              background: '#070d19',
              border: '1px solid #182235',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}
            >
              <span style={{ fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>
                {d.category === 'surplus' ? '💰 Surplus' : d.category}
              </span>
              <span style={{ fontSize: 12 }}>
                <span style={{ color: '#f87171' }}>{formatInr(d.oldAmount)}</span>
                {' → '}
                <span style={{ color: '#86efac' }}>{formatInr(d.newAmount)}</span>
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, margin: 0 }}>{d.reason}</p>
            {d.suggestedUse && (
              <p style={{ fontSize: 11, color: '#fbbf24', marginTop: 4, margin: 0 }}>
                💡 Suggestion: {d.suggestedUse}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
