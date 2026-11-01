import React, { useId } from 'react';
import { Card } from '../ui';
import { HandshakeIcon } from '../icons';
import { BudgetCategory } from '../../lib/budget';
import { CATEGORIES, CAT_LABELS, inputStyle } from './types';

export interface VendorQuoteFormProps {
  form: {
    name: string;
    category: BudgetCategory;
    price: string;
    includes: string;
  };
  formError: string;
  onFormChange: (field: string, value: string) => void;
  onSubmit: () => void;
}

export const VendorQuoteForm: React.FC<VendorQuoteFormProps> = ({
  form,
  formError,
  onFormChange,
  onSubmit,
}) => {
  const formNameId = useId();

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
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
          <HandshakeIcon size={18} color="#38bdf8" />
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Add a vendor quote
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
            A few details now make comparison easier later.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Row 1: 3 columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {/* Vendor Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor={formNameId}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                display: 'flex',
                gap: 4,
              }}
            >
              Vendor name <span style={{ color: '#38bdf8' }}>*</span>
            </label>
            <input
              id={formNameId}
              type="text"
              placeholder="e.g. Regal Banquets"
              value={form.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="vendor-cat-select"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                display: 'flex',
                gap: 4,
              }}
            >
              Category <span style={{ color: '#38bdf8' }}>*</span>
            </label>
            <select
              id="vendor-cat-select"
              value={form.category}
              onChange={(e) => onFormChange('category', e.target.value)}
              style={{
                ...inputStyle,
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 14px center',
                backgroundSize: '16px',
                paddingRight: 40,
                cursor: 'pointer',
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ background: '#070d19', color: '#f8fafc' }}>
                  {CAT_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          {/* Quoted Price */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="vendor-price-input"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                display: 'flex',
                gap: 4,
              }}
            >
              Quoted price (₹) <span style={{ color: '#38bdf8' }}>*</span>
            </label>
            <input
              id="vendor-price-input"
              type="number"
              min="1"
              max="1000000000"
              placeholder="e.g. 450000"
              value={form.price}
              onChange={(e) => onFormChange('price', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Row 2: What's included */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label
            htmlFor="vendor-includes-input"
            style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}
          >
            What&apos;s included
          </label>
          <input
            id="vendor-includes-input"
            type="text"
            placeholder="e.g. Buffet for 200, soft drinks, basic decor"
            value={form.includes}
            onChange={(e) => onFormChange('includes', e.target.value)}
            style={inputStyle}
          />
        </div>

        {formError && (
          <div
            role="alert"
            style={{
              color: '#f87171',
              fontSize: 12,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 6,
              padding: '6px 12px',
            }}
          >
            {formError}
          </div>
        )}

        {/* Footer info & button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
            paddingTop: 14,
            borderTop: '1px solid #141f33',
          }}
        >
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Quotes are kept alongside the budget and timeline.
          </span>
          <button
            type="button"
            onClick={onSubmit}
            style={{
              background: '#38bdf8',
              color: '#030712',
              fontWeight: 600,
              fontSize: 13,
              borderRadius: 8,
              padding: '8px 18px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0284c7')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#38bdf8')}
          >
            + Add vendor
          </button>
        </div>
      </div>
    </Card>
  );
};
