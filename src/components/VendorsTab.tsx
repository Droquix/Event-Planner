'use client';

import React, { useState } from 'react';
import type { BudgetCategory } from '../lib/budget';
import { useAbortableRequest } from '../hooks/useAbortableRequest';
import {
  type VendorQuote,
  REQUIRED_CHECKLIST,
  CATEGORIES,
} from './vendors/types';
import { VendorQuoteForm } from './vendors/VendorQuoteForm';
import { VendorQuoteCard } from './vendors/VendorQuoteCard';
import { VendorComparisonTable } from './vendors/VendorComparisonTable';
import { VendorEmptyState } from './vendors/VendorEmptyState';
import { VendorFilterBar } from './vendors/VendorFilterBar';

function makeId(): string {
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
  const [draftingVendorId, setDraftingVendorId] = useState<string | null>(null);
  const [vendorDrafts, setVendorDrafts] = useState<
    Record<string, { message: string; demo: boolean }>
  >({});
  const [copiedVendorId, setCopiedVendorId] = useState<string | null>(null);

  const draftRequest = useAbortableRequest<
    { category: string; missingInfo: string[]; vendorName?: string; vendorId: string },
    { data?: { message: string }; demo?: boolean }
  >(async (payload, signal) => {
    const res = await fetch('/api/vendor-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: payload.category,
        missingInfo: payload.missingInfo,
        vendorName: payload.vendorName,
      }),
      signal,
    });
    return res.json();
  });

  function handleFormChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAdd() {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setFormError('Vendor name is required.');
      return;
    }
    if (trimmedName.length > 100) {
      setFormError('Vendor name must be 100 characters or fewer.');
      return;
    }
    const numPrice = Number(form.price);
    if (!Number.isFinite(numPrice) || numPrice <= 0) {
      setFormError('Price must be a positive number.');
      return;
    }
    if (numPrice > 1000000000) {
      setFormError('Price exceeds maximum allowable limit of ₹100 Crore.');
      return;
    }
    setFormError('');
    setVendors((prev) => [
      ...prev,
      {
        id: makeId(),
        name: trimmedName,
        category: form.category,
        price: numPrice,
        includes: form.includes.trim().slice(0, 500),
        checklist: emptyChecklist(),
      },
    ]);
    setForm({ name: '', category: 'venue', price: '', includes: '' });
  }

  function toggleChecklistItem(vendorId: string, item: string) {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId ? { ...v, checklist: { ...v.checklist, [item]: !v.checklist[item] } } : v
      )
    );
  }

  function removeVendor(id: string) {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  }

  async function handleDraftMessage(vendor: VendorQuote, missing: string[]) {
    setDraftingVendorId(vendor.id);
    const json = await draftRequest.execute({
      category: vendor.category,
      missingInfo: missing,
      vendorName: vendor.name,
      vendorId: vendor.id,
    });
    setDraftingVendorId(null);
    if (json?.data?.message) {
      setVendorDrafts((prev) => ({
        ...prev,
        [vendor.id]: { message: json.data?.message ?? '', demo: json.demo ?? false },
      }));
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
            fontWeight: 600,
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
          Build a considered shortlist for every essential wedding detail, then keep decisions in
          one quiet place.
        </p>
      </div>

      <VendorQuoteForm
        form={form}
        formError={formError}
        onFormChange={handleFormChange}
        onSubmit={handleAdd}
      />

      {vendors.length === 0 ? (
        <VendorEmptyState />
      ) : (
        <>
          <VendorFilterBar
            filterCat={filterCat}
            byCategory={byCategory}
            onSelectCategory={setFilterCat}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredVendors.map((v) => (
              <VendorQuoteCard
                key={v.id}
                vendor={v}
                isDrafting={draftingVendorId === v.id}
                draft={vendorDrafts[v.id]}
                isCopied={copiedVendorId === v.id}
                onRemove={removeVendor}
                onToggleChecklist={toggleChecklistItem}
                onDraftMessage={handleDraftMessage}
                onCopy={handleCopy}
              />
            ))}
          </div>

          {CATEGORIES.map((cat) => {
            const catVendors = byCategory[cat];
            if (catVendors.length < 2) return null;
            return <VendorComparisonTable key={cat} category={cat} vendors={catVendors} />;
          })}
        </>
      )}
    </div>
  );
}
