'use client';

import React from 'react';
import { CATEGORIES } from './vendors/types';
import { VendorQuoteForm } from './vendors/VendorQuoteForm';
import { VendorQuoteCard } from './vendors/VendorQuoteCard';
import { VendorComparisonTable } from './vendors/VendorComparisonTable';
import { VendorEmptyState } from './vendors/VendorEmptyState';
import { VendorFilterBar } from './vendors/VendorFilterBar';
import { useVendorsManager } from './vendors/useVendorsManager';

export default function VendorsTab() {
  const {
    vendors,
    form,
    formError,
    filterCat,
    draftingVendorId,
    vendorDrafts,
    copiedVendorId,
    byCategory,
    displayedVendors,
    setFilterCat,
    handleFormChange,
    handleAdd,
    toggleChecklistItem,
    removeVendor,
    handleDraftMessage,
    handleCopy,
  } = useVendorsManager();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <VendorQuoteForm
        form={form}
        formError={formError}
        onFormChange={handleFormChange}
        onSubmit={handleAdd}
      />

      {vendors.length > 0 && (
        <VendorFilterBar
          filterCat={filterCat}
          byCategory={byCategory}
          onSelectCategory={setFilterCat}
        />
      )}

      {displayedVendors.map((vendor) => (
        <VendorQuoteCard
          key={vendor.id}
          vendor={vendor}
          isDrafting={draftingVendorId === vendor.id}
          draft={vendorDrafts[vendor.id]}
          isCopied={copiedVendorId === vendor.id}
          onRemove={removeVendor}
          onToggleChecklist={toggleChecklistItem}
          onDraftMessage={handleDraftMessage}
          onCopy={handleCopy}
        />
      ))}

      {CATEGORIES.map((cat) => {
        if (byCategory[cat].length >= 2) {
          return <VendorComparisonTable key={cat} category={cat} vendors={byCategory[cat]} />;
        }
        return null;
      })}

      {vendors.length === 0 && <VendorEmptyState />}
    </div>
  );
}
