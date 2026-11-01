import { useState } from 'react';
import type { BudgetCategory } from '../../lib/budget';
import { type VendorQuote, REQUIRED_CHECKLIST, CATEGORIES } from './types';
import { useVendorDrafts } from './useVendorDrafts';

function makeId(): string {
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function emptyChecklist(): Record<string, boolean> {
  return Object.fromEntries(REQUIRED_CHECKLIST.map((k) => [k, false]));
}

function validateVendorForm(name: string, priceStr: string): string | null {
  const trimmedName = name.trim();
  if (!trimmedName) return 'Vendor name is required.';
  if (trimmedName.length > 100) return 'Vendor name must be 100 characters or fewer.';
  const numPrice = Number(priceStr);
  if (!Number.isFinite(numPrice) || numPrice <= 0) return 'Price must be a positive number.';
  if (numPrice > 1000000000) return 'Price exceeds maximum allowable limit of ₹100 Crore.';
  return null;
}

export function useVendorsManager() {
  const [vendors, setVendors] = useState<VendorQuote[]>([]);
  const [form, setForm] = useState({
    name: '',
    category: 'venue' as BudgetCategory,
    price: '',
    includes: '',
  });
  const [formError, setFormError] = useState('');
  const [filterCat, setFilterCat] = useState<BudgetCategory | 'all'>('all');

  const drafts = useVendorDrafts();

  function handleFormChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAdd() {
    const validationError = validateVendorForm(form.name, form.price);
    if (validationError) {
      setFormError(validationError);
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

  const byCategory = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = vendors.filter((v) => v.category === cat);
      return acc;
    },
    {} as Record<BudgetCategory, VendorQuote[]>
  );

  const displayedVendors =
    filterCat === 'all' ? vendors : vendors.filter((v) => v.category === filterCat);

  return {
    vendors,
    form,
    formError,
    filterCat,
    byCategory,
    displayedVendors,
    setFilterCat,
    handleFormChange,
    handleAdd,
    toggleChecklistItem,
    removeVendor,
    ...drafts,
  };
}
