'use client';

import React, { useState, useId } from 'react';
import { Card, AIBadge, fmt } from './ui';
import { HandshakeIcon, EmptyBoxIcon } from './icons';
import type { BudgetCategory } from '../lib/budget';

// Checklist items every vendor should confirm before booking
const REQUIRED_CHECKLIST = [
  'Cancellation policy',
  'Advance / deposit amount',
  'Overtime charge rate',
  'GST / tax included?',
  'Backup plan if vendor cancels',
  'Payment schedule',
  'Deliverables list in writing',
];

export interface VendorQuote {
  id: string;
  name: string;
  category: BudgetCategory;
  price: number;
  includes: string;
  checklist: Record<string, boolean>;
}

const CATEGORIES: BudgetCategory[] = [
  'venue', 'catering', 'decor', 'photography', 'entertainment', 'misc',
];

const CAT_LABELS: Record<BudgetCategory, string> = {
  venue: 'Venue',
  catering: 'Catering',
  decor: 'Decor',
  photography: 'Photography',
  entertainment: 'Entertainment',
  misc: 'Misc',
};

function makeId() {
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function emptyChecklist(): Record<string, boolean> {
  return Object.fromEntries(REQUIRED_CHECKLIST.map((k) => [k, false]));
}

export default function VendorsTab() {
  const [vendors, setVendors] = useState<VendorQuote[]>([]);
  const [form, setForm] = useState({
    name: '',
    category: 'venue' as BudgetCategory,
    price: '',
    includes: '',
  });
  const [formError, setFormError] = useState('');
  const [filterCat, setFilterCat] = useState<BudgetCategory | 'all'>('all');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const formNameId = useId();

  // AI draft message state per vendor id
  const [draftingVendorId, setDraftingVendorId] = useState<string | null>(null);
  const [vendorDrafts, setVendorDrafts] = useState<
    Record<string, { message: string; demo: boolean }>
  >({});
  const [copiedVendorId, setCopiedVendorId] = useState<string | null>(null);

  function handleAdd() {
    if (!form.name.trim()) {
      setFormError('Vendor name is required.');
      return;
    }
    if (!(Number(form.price) > 0)) {
      setFormError('Price must be a positive number.');
      return;
    }
    setFormError('');
    setVendors((prev) => [
      ...prev,
      {
        id: makeId(),
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        includes: form.includes.trim(),
        checklist: emptyChecklist(),
      },
    ]);
    setForm({ name: '', category: 'venue', price: '', includes: '' });
  }

  function toggleChecklistItem(vendorId: string, item: string) {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? { ...v, checklist: { ...v.checklist, [item]: !v.checklist[item] } }
          : v
      )
    );
  }

  function removeVendor(id: string) {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  }

  async function handleDraftMessage(vendor: VendorQuote, missing: string[]) {
    setDraftingVendorId(vendor.id);
    try {
      const res = await fetch('/api/vendor-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: vendor.category,
          missingInfo: missing,
          vendorName: vendor.name,
        }),
      });
      const json = await res.json();
      if (json.data?.message) {
        setVendorDrafts((prev) => ({
          ...prev,
          [vendor.id]: { message: json.data.message, demo: !!json.demo },
        }));
      }
    } catch {
      // Ignore draft error
    } finally {
      setDraftingVendorId(null);
    }
  }

  function handleCopy(vendorId: string, text: string) {
    navigator.clipboard?.writeText(text);
    setCopiedVendorId(vendorId);
    setTimeout(() => setCopiedVendorId(null), 2500);
  }

  const byCategory = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = vendors.filter((v) => v.category === cat);
      return acc;
    },
    {} as Record<BudgetCategory, VendorQuote[]>
  );

  const filteredVendors =
    filterCat === 'all' ? vendors : vendors.filter((v) => v.category === filterCat);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Centered Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: 12, paddingTop: 8 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          VENDOR WORKSPACE
        </p>
        <h2
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.18,
            letterSpacing: '-0.02em',
            marginBottom: 14,
          }}
        >
          Gather quotes with confidence.
        </h2>
        <p
          style={{
            fontSize: 14,
            color: '#94a3b8',
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Build a considered shortlist for every essential wedding detail, then keep decisions in one quiet place.
        </p>
      </div>

      {/* Card 1: Add a vendor quote */}
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
              <label htmlFor={formNameId} style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1' }}>
                Vendor name *
              </label>
              <input
                id={formNameId}
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Regal Banquets"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
                onBlur={(e)  => (e.target.style.borderColor = '#1e293b')}
              />
            </div>

            {/* Category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="vendor-cat" style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1' }}>
                Category *
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="vendor-cat"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as BudgetCategory })}
                  style={{
                    ...inputStyle,
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    paddingRight: 32,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
                  onBlur={(e)  => (e.target.style.borderColor = '#1e293b')}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CAT_LABELS[c]}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#64748b',
                    fontSize: 11,
                  }}
                >
                  ▼
                </span>
              </div>
            </div>

            {/* Quoted Price */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="vendor-price" style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1' }}>
                Quoted price (₹) *
              </label>
              <input
                id="vendor-price"
                type="number"
                min={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder=""
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
                onBlur={(e)  => (e.target.style.borderColor = '#1e293b')}
              />
            </div>
          </div>

          {/* Row 2: What's included */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="vendor-includes" style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1' }}>
              What&apos;s included
            </label>
            <input
              id="vendor-includes"
              type="text"
              value={form.includes}
              onChange={(e) => setForm({ ...form, includes: e.target.value })}
              placeholder="e.g. Buffet for 200, soft drinks, basic decor"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
              onBlur={(e)  => (e.target.style.borderColor = '#1e293b')}
            />
          </div>

          {/* Form Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Quotes are kept alongside the budget and timeline.
            </span>
            <button
              type="button"
              onClick={handleAdd}
              style={{
                background: '#60a5fa',
                color: '#070d19',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#3b82f6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#60a5fa')}
            >
              <span>+ Add vendor</span>
            </button>
          </div>

          {formError && (
            <p role="alert" style={{ color: '#fca5a5', fontSize: 12, margin: 0 }}>
              {formError}
            </p>
          )}
        </div>
      </Card>

      {/* Card 2: Empty State or Vendor List */}
      {vendors.length === 0 ? (
        <Card
          style={{
            padding: '54px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: '#172339',
              color: '#38bdf8',
              width: 44,
              height: 44,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <EmptyBoxIcon size={24} color="#38bdf8" />
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>
            No vendors added yet.
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 20px', maxWidth: 360, lineHeight: 1.5 }}>
            Add your first quote above to begin building a trusted wedding team.
          </p>

          <button
            type="button"
            onClick={() => setShowGuideModal(!showGuideModal)}
            style={{
              background: '#131c31',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '8px 16px',
              color: '#cbd5e1',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#131c31')}
          >
            Learn how quotes work
          </button>

          {showGuideModal && (
            <div
              style={{
                marginTop: 20,
                maxWidth: 440,
                background: '#070d19',
                border: '1px solid #1e293b',
                borderRadius: 8,
                padding: '14px 18px',
                textAlign: 'left',
                fontSize: 12,
                color: '#94a3b8',
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 4 }}>
                💡 Vendor Management Tips:
              </strong>
              Collect 2-3 quotes per category. Use our 7-item checklist to check for hidden costs (taxes, overtime, cancellation terms). Click &quot;Draft inquiry&quot; on any vendor to let our AI write a polite clarification email.
            </div>
          )}
        </Card>
      ) : (
        <>
          {/* Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              onClick={() => setFilterCat('all')}
              style={{
                background: filterCat === 'all' ? '#1c2a47' : '#0d1527',
                border: '1px solid #182235',
                borderRadius: 9999,
                padding: '4px 14px',
                color: filterCat === 'all' ? '#ffffff' : '#94a3b8',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              All
            </button>
            {CATEGORIES.filter((c) => byCategory[c].length > 0).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilterCat(c)}
                style={{
                  background: filterCat === c ? '#1c2a47' : '#0d1527',
                  border: '1px solid #182235',
                  borderRadius: 9999,
                  padding: '4px 14px',
                  color: filterCat === c ? '#ffffff' : '#94a3b8',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>

          {/* Vendor Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredVendors.map((v) => {
              const unchecked = REQUIRED_CHECKLIST.filter((k) => !v.checklist[k]);
              return (
                <Card key={v.id}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 16, color: '#f8fafc' }}>
                          {v.name}
                        </span>
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
                          {CAT_LABELS[v.category]}
                        </span>
                      </div>
                      <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: 18, marginTop: 4 }}>
                        {fmt(v.price)}
                      </div>
                      {v.includes && (
                        <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, margin: 0 }}>
                          Includes: {v.includes}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeVendor(v.id)}
                      aria-label={`Remove vendor ${v.name}`}
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
                        const checked = v.checklist[item];
                        const cbId = `${v.id}-${item.replace(/\s+/g, '-')}`;
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
                              onChange={() => toggleChecklistItem(v.id, item)}
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
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #182235', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        type="button"
                        disabled={draftingVendorId === v.id}
                        onClick={() => handleDraftMessage(v, unchecked)}
                        style={{
                          background: '#131c31',
                          border: '1px solid #1e293b',
                          borderRadius: 8,
                          padding: '6px 14px',
                          color: '#cbd5e1',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: draftingVendorId === v.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {draftingVendorId === v.id
                          ? '⏳ Drafting with AI...'
                          : `✉️ Draft inquiry (${unchecked.length} missing)`}
                      </button>
                      {draftingVendorId === v.id && <AIBadge loading={true} />}
                      {vendorDrafts[v.id] && draftingVendorId !== v.id && (
                        <AIBadge demo={vendorDrafts[v.id].demo} />
                      )}
                    </div>
                  </div>

                  {/* Rendered drafted message */}
                  {vendorDrafts[v.id] && (
                    <div
                      style={{
                        marginTop: 12,
                        background: '#070d19',
                        border: '1px solid #1e293b',
                        borderRadius: 8,
                        padding: 14,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                          Drafted Inquiry Message
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(v.id, vendorDrafts[v.id].message)}
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
                          {copiedVendorId === v.id ? '✓ Copied!' : '📋 Copy'}
                        </button>
                      </div>
                      <p style={{ fontSize: 12, color: '#f1f5f9', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {vendorDrafts[v.id].message}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Comparison table */}
          {CATEGORIES.filter((c) => byCategory[c].length > 1).map((cat) => (
            <Card key={cat} style={{ overflowX: 'auto' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', marginBottom: 14 }}>
                Compare {CAT_LABELS[cat]} vendors
              </h3>
              <table
                role="table"
                aria-label={`Vendor comparison for ${cat}`}
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
              >
                <thead>
                  <tr>
                    {['VENDOR', 'PRICE', "WHAT'S INCLUDED", 'CHECKLIST COMPLETE'].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        style={{
                          padding: '10px 14px',
                          textAlign: 'left',
                          color: '#64748b',
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid #182235',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byCategory[cat]
                    .sort((a, b) => a.price - b.price)
                    .map((v, i) => {
                      const doneCount = REQUIRED_CHECKLIST.filter((k) => v.checklist[k]).length;
                      const isCheapest = i === 0;
                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid #141f33' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 500, color: '#f8fafc' }}>
                            {v.name}
                            {isCheapest && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: 10,
                                  background: '#064e3b',
                                  color: '#6ee7b7',
                                  borderRadius: 9999,
                                  padding: '1px 8px',
                                  fontWeight: 600,
                                }}
                              >
                                lowest
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#38bdf8', fontWeight: 700 }}>
                            {fmt(v.price)}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                            {v.includes || '—'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                color: doneCount === REQUIRED_CHECKLIST.length ? '#6ee7b7' : '#fde68a',
                                fontWeight: 600,
                              }}
                            >
                              {doneCount}/{REQUIRED_CHECKLIST.length}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </Card>
          ))}
        </>
      )}

    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#070d19',
  border: '1px solid #1e293b',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#f8fafc',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s ease',
};
