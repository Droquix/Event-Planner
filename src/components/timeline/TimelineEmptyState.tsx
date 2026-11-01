import React from 'react';
import { Card } from '../ui';

interface Props {
  onGoToOnboarding?: () => void;
}

export const TimelineEmptyState: React.FC<Props> = ({ onGoToOnboarding }) => (
  <div style={{ padding: '20px 0' }}>
    <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>
          No event date selected
        </h3>
        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
          Set an event date in Onboarding to calculate milestones backwards, evaluate lead
          times, and monitor dependencies.
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
