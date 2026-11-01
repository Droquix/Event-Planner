'use client';

import React from 'react';
import type { BudgetCategory } from '../../lib/budget';
import { CATEGORIES, CAT_LABELS, type VendorQuote } from './types';

export interface VendorFilterBarProps {
  filterCat: BudgetCategory | 'all';
  byCategory: Record<BudgetCategory, VendorQuote[]>;
  onSelectCategory: (cat: BudgetCategory | 'all') => void;
}

/**
 * Filter pill bar to toggle between all categories and active quoted categories.
 */
export const VendorFilterBar: React.FC<VendorFilterBarProps> = ({
  filterCat,
  byCategory,
  onSelectCategory,
}) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <button
        type="button"
        onClick={() => onSelectCategory('all')}
        style={{
          background: filterCat === 'all' ? '#1c2a47' : '#0d1527',
          border: '1px solid #182235',
          borderRadius: 9999,
          padding: '6px 16px',
          minHeight: 44,
          color: filterCat === 'all' ? '#ffffff' : '#94a3b8',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        All
      </button>
      {CATEGORIES.filter((c) => byCategory[c].length > 0).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onSelectCategory(c)}
          style={{
            background: filterCat === c ? '#1c2a47' : '#0d1527',
            border: '1px solid #182235',
            borderRadius: 9999,
            padding: '6px 16px',
            minHeight: 44,
            color: filterCat === c ? '#ffffff' : '#94a3b8',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {CAT_LABELS[c]}
        </button>
      ))}
    </div>
  );
};
