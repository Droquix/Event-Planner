'use client';

import React, { useState, useId } from 'react';
import { Btn, Card, SectionHeading, fmt, AIBadge } from './ui';
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

const CAT_ICONS: Record<BudgetCategory, string> = {
  venue: '🏛️', catering: '🍽️', decor: '🌸',
  photography: '📷', entertainment: '🎵', misc: '📦',
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
    name: '', category: 'venue' as BudgetCategory, price: '', includes: '',
  });
  const [formError, setFormError] = useState('');
  const [filterCat, setFilterCat] = useState<BudgetCategory | 'all'>('all');
  const formNameId = useId();

  // AI draft message state per vendor id
  const [draftingVendorId, setDraftingVendorId] = useState<string | null>(null);
  const [vendorDrafts, setVendorDrafts] = useState<
    Record<string, { message: string; demo: boolean }>
  >({});
  const [copiedVendorId, setCopiedVendorId] = useState<string | null>(null);

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
      // Gracefully handle draft error
    } finally {
      setDraftingVendorId(null);
    }
  }

  function handleCopy(vendorId: string, text: string) {
    navigator.clipboard?.writeText(text);
    setCopiedVendorId(vendorId);
    setTimeout(() => setCopiedVendorId(null), 2500);
  }

  function handleAdd() {
    if (!form.name.trim()) { setFormError('Vendor name is required.'); return; }
    if (!(Number(form.price) > 0)) { setFormError('Price must be a positive number.'); return; }
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

  // Group by category for comparison table
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
      {/* Add vendor form */}
      <Card>
        <SectionHeading>Add a vendor quote</SectionHeading>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 14,
            marginBottom: 14,
          }}
        >
          {/* Vendor name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor={formNameId} style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>
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
              onBlur={(e)  => (e.target.style.borderColor = '#334155')}
            />
          </div>

          {/* Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="vendor-cat" style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>
              Category *
            </label>
            <select
              id="vendor-cat"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as BudgetCategory })}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
              onBlur={(e)  => (e.target.style.borderColor = '#334155')}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="vendor-price" style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>
              Quoted price (₹) *
            </label>
            <input
              id="vendor-price"
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 250000"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
              onBlur={(e)  => (e.target.style.borderColor = '#334155')}
            />
          </div>

          {/* What's included */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
            <label htmlFor="vendor-includes" style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>
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
              onBlur={(e)  => (e.target.style.borderColor = '#334155')}
            />
          </div>
        </div>

        {formError && (
          <p role="alert" style={{ color: '#fca5a5', fontSize: 13, marginBottom: 10 }}>
            {formError}
          </p>
        )}
        <Btn onClick={handleAdd}>+ Add vendor</Btn>
      </Card>

      {vendors.length === 0 ? (
        <div style={{ color: '#64748b', textAlign: 'center', padding: 32 }}>
          No vendors added yet. Add your first quote above.
        </div>
      ) : (
        <>
          {/* Filter bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <FilterBtn active={filterCat === 'all'} onClick={() => setFilterCat('all')}>All</FilterBtn>
            {CATEGORIES.filter((c) => byCategory[c].length > 0).map((c) => (
              <FilterBtn key={c} active={filterCat === c} onClick={() => setFilterCat(c)}>
                {CAT_ICONS[c]} {c}
              </FilterBtn>
            ))}
          </div>

          {/* Vendor cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredVendors.map((v) => {
              const unchecked = REQUIRED_CHECKLIST.filter((k) => !v.checklist[k]);
              return (
                <Card key={v.id} style={{ position: 'relative' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }} aria-hidden>{CAT_ICONS[v.category]}</span>
                        <span style={{ fontWeight: 700, fontSize: 16, color: '#e2e8f0' }}>{v.name}</span>
                        <span style={{
                          background: '#1e3a5f', color: '#93c5fd',
                          borderRadius: 12, padding: '1px 8px', fontSize: 11,
                        }}>
                          {v.category}
                        </span>
                      </div>
                      <div style={{ color: '#7dd3fc', fontWeight: 700, fontSize: 18, marginTop: 2 }}>
                        {fmt(v.price)}
                      </div>
                      {v.includes && (
                        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                          Includes: {v.includes}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVendor(v.id)}
                      aria-label={`Remove vendor ${v.name}`}
                      style={{
                        background: 'transparent', border: 'none',
                        color: '#64748b', cursor: 'pointer', fontSize: 18,
                        alignSelf: 'flex-start',
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Checklist */}
                  <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                    <legend style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>
                      Information checklist
                      {unchecked.length > 0 && (
                        <span style={{ color: '#fda4af', marginLeft: 8, fontSize: 12 }}>
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
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: checked ? '#14532d' : '#1e293b',
                              border: `1px solid ${checked ? '#166534' : '#334155'}`,
                              borderRadius: 8, padding: '5px 12px',
                              cursor: 'pointer', fontSize: 12,
                              color: checked ? '#86efac' : '#94a3b8',
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
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Btn
                        variant="secondary"
                        size="sm"
                        disabled={draftingVendorId === v.id}
                        onClick={() => handleDraftMessage(v, unchecked)}
                      >
                        {draftingVendorId === v.id
                          ? '⏳ Drafting with AI...'
                          : `✉️ Draft inquiry (${unchecked.length} missing)`}
                      </Btn>
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
                        background: '#09233f',
                        border: '1px solid #1e4b7a',
                        borderRadius: 8,
                        padding: 14,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#7dd3fc' }}>
                          Drafted Inquiry Message
                        </span>
                        <Btn
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(v.id, vendorDrafts[v.id].message)}
                        >
                          {copiedVendorId === v.id ? '✓ Copied!' : '📋 Copy'}
                        </Btn>
                      </div>
                      <p style={{ fontSize: 13, color: '#f1f5f9', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
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
              <SectionHeading>
                {CAT_ICONS[cat]} Compare {cat} vendors
              </SectionHeading>
              <table
                role="table"
                aria-label={`Vendor comparison for ${cat}`}
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
              >
                <thead>
                  <tr>
                    {['Vendor', 'Price', "What's included", 'Checklist complete'].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        style={{
                          padding: '8px 12px', textAlign: 'left',
                          color: '#64748b', fontSize: 12, fontWeight: 600,
                          borderBottom: '1px solid #334155',
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
                        <tr key={v.id} style={{ borderBottom: '1px solid #1e3a5f' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#e2e8f0' }}>
                            {v.name}
                            {isCheapest && (
                              <span style={{
                                marginLeft: 8, fontSize: 10, background: '#14532d',
                                color: '#86efac', borderRadius: 10, padding: '1px 6px',
                              }}>
                                lowest
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#7dd3fc', fontWeight: 700 }}>
                            {fmt(v.price)}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                            {v.includes || '—'}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              color: doneCount === REQUIRED_CHECKLIST.length ? '#86efac' : '#fde68a',
                              fontWeight: 600,
                            }}>
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

// ── Helpers ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#f8fafc',
  fontSize: 14,
  outline: 'none',
  width: '100%',
};

function FilterBtn({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        background: active ? '#0c4a6e' : '#1e293b',
        border: `1px solid ${active ? '#38bdf8' : '#334155'}`,
        borderRadius: 8,
        padding: '5px 14px',
        color: active ? '#e0f2fe' : '#64748b',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 700 : 400,
      }}
    >
      {children}
    </button>
  );
}
