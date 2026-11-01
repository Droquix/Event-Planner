'use client';

import React from 'react';
import { Card } from '../ui';

export interface BudgetEmptyCardProps {
  onGoToOnboarding?: () => void;
}

/**
 * Empty placeholder card shown when no budget has been configured yet.
 */
export const BudgetEmptyCard: React.FC<BudgetEmptyCardProps> = ({ onGoToOnboarding }) => {
  return (
    <div style={{ padding: '20px 0' }}>
      <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>
            No budget plan configured
          </h3>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
            Complete the event details in Onboarding with your target budget and guest count to
            generate an intelligent allocation breakdown.
          </p>
          {onGoToOnboarding && (
            <button
              type="button"
              onClick={onGoToOnboarding}
              style={{
                background: '#60a5fa',
                color: '#070d19',
                border: 'none',
                borderRadius: 8,
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to Onboarding →
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};
