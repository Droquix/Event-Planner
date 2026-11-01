import React from 'react';
import { Card, AIBadge } from '../ui';
import { IdeaItem } from './types';

export interface BudgetIdeasGridProps {
  ideas: IdeaItem[];
  ideasLoading: boolean;
  ideasDemo?: boolean;
  occasionText: string;
  cityText: string;
  onRefreshIdeas: () => void;
}

export const BudgetIdeasGrid: React.FC<BudgetIdeasGridProps> = ({
  ideas,
  ideasLoading,
  ideasDemo,
  occasionText,
  cityText,
  onRefreshIdeas,
}) => {
  return (
    <Card>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#38bdf8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: 0,
              marginBottom: 4,
            }}
          >
            AI PERSONALIZED IDEAS
          </p>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Small upgrades, tailored to {cityText}.
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
            Creative enhancements for this {occasionText}&apos;s priorities.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AIBadge demo={ideasDemo} loading={ideasLoading} />
          <button
            type="button"
            onClick={onRefreshIdeas}
            disabled={ideasLoading}
            style={{
              background: '#60a5fa',
              color: '#070d19',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              minHeight: 44,
              fontSize: 12,
              fontWeight: 700,
              cursor: ideasLoading ? 'not-allowed' : 'pointer',
              opacity: ideasLoading ? 0.5 : 1,
              transition: 'background 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#3b82f6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#60a5fa')}
          >
            {ideasLoading ? 'Generating...' : 'Refresh Ideas'}
          </button>
        </div>
      </div>

      {ideasLoading && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          style={{ padding: '24px 0', textAlign: 'center', color: '#93c5fd', fontSize: 13 }}
        >
          ⏳ Consulting AI model for personalized event ideas...
        </div>
      )}

      {!ideasLoading && ideas.length > 0 && (
        <div
          aria-live="polite"
          aria-busy="false"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
          }}
        >
          {ideas.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#070d19',
                border: '1px solid #1e293b',
                borderRadius: 8,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8' }}>
                  {item.costRange}
                </span>
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#f8fafc',
                    marginTop: 4,
                    marginBottom: 6,
                  }}
                >
                  {idx + 1}. {item.title}
                </h4>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                  {item.whyItFits}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
