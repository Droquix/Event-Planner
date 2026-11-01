import React from 'react';
import { Card, AIBadge } from '../ui';
import { VendorQuote, CAT_LABELS, REQUIRED_CHECKLIST, formatInr } from './types';

export interface VendorQuoteCardProps {
  vendor: VendorQuote;
  isDrafting: boolean;
  draft?: { message: string; demo: boolean };
  isCopied: boolean;
  onRemove: (id: string) => void;
  onToggleChecklist: (id: string, item: string) => void;
  onDraftMessage: (vendor: VendorQuote, missing: string[]) => void;
  onCopy: (id: string, text: string) => void;
}

export const VendorQuoteCard: React.FC<VendorQuoteCardProps> = ({
  vendor,
  isDrafting,
  draft,
  isCopied,
  onRemove,
  onToggleChecklist,
  onDraftMessage,
  onCopy,
}) => {
  const unchecked = REQUIRED_CHECKLIST.filter((k) => !vendor.checklist[k]);

  return (
    <Card>
      {/* Card Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#f8fafc' }}>{vendor.name}</span>
            <span
              style={{
                background: '#131d33',
                color: '#93c5fd',
                borderRadius: 9999,
                padding: '1px 8px',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {CAT_LABELS[vendor.category]}
            </span>
          </div>
          <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: 18, marginTop: 4 }}>
            {formatInr(vendor.price)}
          </div>
          {vendor.includes && (
            <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, margin: 0 }}>
              Includes: {vendor.includes}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(vendor.id)}
          aria-label={`Remove vendor ${vendor.name}`}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
            padding: 4,
          }}
        >
          ×
        </button>
      </div>

      {/* Checklist */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>
          Information checklist
          {unchecked.length > 0 && (
            <span style={{ color: '#f87171', marginLeft: 8, fontSize: 11 }}>
              ⚠ {unchecked.length} item{unchecked.length > 1 ? 's' : ''} missing
            </span>
          )}
        </legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {REQUIRED_CHECKLIST.map((item) => {
            const checked = vendor.checklist[item];
            const cbId = `${vendor.id}-${item.replace(/\s+/g, '-')}`;
            return (
              <label
                key={item}
                htmlFor={cbId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: checked ? '#064e3b' : '#070d19',
                  border: `1px solid ${checked ? '#059669' : '#1e293b'}`,
                  borderRadius: 8,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: checked ? '#6ee7b7' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  id={cbId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleChecklist(vendor.id, item)}
                  style={{ accentColor: '#22c55e', cursor: 'pointer' }}
                  aria-label={item}
                />
                {checked ? '✓' : '○'} {item}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* AI Draft Message Action */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: '1px solid #182235',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            disabled={isDrafting}
            onClick={() => onDraftMessage(vendor, unchecked)}
            style={{
              background: '#131c31',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '6px 14px',
              color: '#cbd5e1',
              fontSize: 12,
              fontWeight: 500,
              cursor: isDrafting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isDrafting
              ? '⏳ Drafting with AI...'
              : `✉️ Draft inquiry (${unchecked.length} missing)`}
          </button>
          {isDrafting && <AIBadge loading={true} />}
          {draft && !isDrafting && <AIBadge demo={draft.demo} />}
        </div>
      </div>

      {/* Rendered drafted message */}
      {draft && (
        <div
          style={{
            marginTop: 12,
            background: '#070d19',
            border: '1px solid #1e293b',
            borderRadius: 8,
            padding: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
              Drafted Inquiry Message
            </span>
            <button
              type="button"
              onClick={() => onCopy(vendor.id, draft.message)}
              style={{
                background: '#131c31',
                border: '1px solid #1e293b',
                borderRadius: 6,
                padding: '3px 10px',
                color: '#cbd5e1',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {isCopied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <p
            style={{
              fontSize: 12,
              color: '#f1f5f9',
              lineHeight: 1.6,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {draft.message}
          </p>
        </div>
      )}
    </Card>
  );
};
