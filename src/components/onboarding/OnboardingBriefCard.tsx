import React from 'react';
import { Card, AIBadge } from '../ui';
import { SparklesIcon } from '../icons';

export interface OnboardingBriefCardProps {
  text: string;
  parsing: boolean;
  parseError: string;
  aiDemo?: boolean;
  onTextChange: (val: string) => void;
  onParse: () => void;
  onLoadSample: () => void;
}

export const OnboardingBriefCard: React.FC<OnboardingBriefCardProps> = ({
  text,
  parsing,
  parseError,
  aiDemo,
  onTextChange,
  onParse,
  onLoadSample,
}) => {
  return (
    <Card>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}
      >
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            Describe your event (optional)
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
            Share the outline and we&apos;ll prefill the details below.
          </p>
        </div>
        <div style={{ color: '#60a5fa', opacity: 0.85, padding: 4 }}>
          <SparklesIcon size={18} color="#60a5fa" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label
          htmlFor="intake-text"
          style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}
        >
          Event description
        </label>
        <textarea
          id="intake-text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="e.g. We are planning a wedding in Mumbai for around 200 guests on 15 February 2027. Budget is 25 lakhs. Top priorities are food and photography."
          rows={4}
          style={{
            background: '#070d19',
            border: '1px solid #1e293b',
            borderRadius: 8,
            padding: '12px 14px',
            color: '#f8fafc',
            fontSize: 13,
            resize: 'vertical',
            width: '100%',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
          onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
          onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
          aria-describedby="intake-help"
        />
        <span
          id="intake-help"
          style={{ fontSize: 11, color: '#64748b', marginTop: 6, marginBottom: 14 }}
        >
          Mention date, budget, guest count, and city. You can always edit the details.
        </span>

        {parseError && (
          <p role="alert" style={{ color: '#fca5a5', fontSize: 12, marginBottom: 12 }}>
            {parseError}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onParse}
            disabled={parsing || !text.trim()}
            style={{
              background: '#60a5fa',
              color: '#070d19',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 12,
              fontWeight: 700,
              cursor: parsing || !text.trim() ? 'not-allowed' : 'pointer',
              opacity: parsing || !text.trim() ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#3b82f6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#60a5fa')}
          >
            <SparklesIcon size={14} color="#070d19" />
            <span>{parsing ? 'Analyzing with AI…' : 'Auto-fill fields'}</span>
          </button>
          <button
            type="button"
            onClick={onLoadSample}
            style={{
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f8fafc';
              e.currentTarget.style.borderColor = '#334155';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = '#1e293b';
            }}
          >
            Load sample brief
          </button>
          <AIBadge demo={aiDemo} loading={parsing} />
        </div>
      </div>
    </Card>
  );
};
