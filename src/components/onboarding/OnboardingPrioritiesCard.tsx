import React from 'react';
import { Card } from '../ui';
import { PRIORITY_OPTIONS } from './types';

export interface OnboardingPrioritiesCardProps {
  priorities: string[];
  onTogglePriority: (priority: string) => void;
}

const PrioritiesHeader: React.FC<{ count: number }> = ({ count }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
        Priorities (pick up to 3)
      </h3>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
        Selected categories receive a larger share of the budget.
      </p>
    </div>
    <div
      style={{
        background: '#131d33',
        border: '1px solid #1e293b',
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 9999,
      }}
    >
      {count} / 3 selected
    </div>
  </div>
);

interface ButtonProps {
  value: string;
  label: string;
  active: boolean;
  rank: number;
  onToggle: (val: string) => void;
}

const PriorityButton: React.FC<ButtonProps> = ({ value, label, active, rank, onToggle }) => (
  <button
    key={value}
    type="button"
    role="checkbox"
    aria-checked={active}
    onClick={() => onToggle(value)}
    style={{
      background: active ? '#60a5fa' : '#070d19',
      border: active ? '1px solid #60a5fa' : '1px solid #1e293b',
      borderRadius: 8,
      padding: '7px 16px',
      color: active ? '#070d19' : '#cbd5e1',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: active ? 700 : 500,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      transition: 'all 0.15s ease',
    }}
  >
    {active && (
      <span
        aria-label={`Priority rank ${rank + 1}`}
        style={{
          background: '#070d19',
          color: '#60a5fa',
          borderRadius: '50%',
          width: 17,
          height: 17,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 800,
        }}
      >
        {rank + 1}
      </span>
    )}
    <span>{label}</span>
  </button>
);

export const OnboardingPrioritiesCard: React.FC<OnboardingPrioritiesCardProps> = ({
  priorities,
  onTogglePriority,
}) => {
  return (
    <Card>
      <PrioritiesHeader count={priorities.length} />

      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend className="sr-only">Budget priorities</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {PRIORITY_OPTIONS.map(({ value, label }) => {
            const active = priorities.includes(value);
            const rank = priorities.indexOf(value);
            return (
              <PriorityButton
                key={value}
                value={value}
                label={label}
                active={active}
                rank={rank}
                onToggle={onTogglePriority}
              />
            );
          })}
        </div>
      </fieldset>
    </Card>
  );
};
