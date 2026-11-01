import React from 'react';
import { Card } from '../ui';
import { VendorQuote, CAT_LABELS, REQUIRED_CHECKLIST, formatInr } from './types';
import { BudgetCategory } from '../../lib/budget';

export interface VendorComparisonTableProps {
  category: BudgetCategory;
  vendors: VendorQuote[];
}

export const VendorComparisonTable: React.FC<VendorComparisonTableProps> = ({
  category,
  vendors,
}) => {
  const sortedVendors = [...vendors].sort((a, b) => a.price - b.price);

  return (
    <Card style={{ overflowX: 'auto' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', marginBottom: 14 }}>
        Compare {CAT_LABELS[category]} vendors
      </h3>
      <table
        role="table"
        aria-label={`Vendor comparison for ${category}`}
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
      >
        <thead>
          <tr>
            {['VENDOR', 'PRICE', "WHAT'S INCLUDED", 'CHECKLIST COMPLETE'].map((header) => (
              <th
                key={header}
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
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedVendors.map((vendor, index) => {
            const doneCount = REQUIRED_CHECKLIST.filter((k) => vendor.checklist[k]).length;
            const isCheapest = index === 0;

            return (
              <tr key={vendor.id} style={{ borderBottom: '1px solid #141f33' }}>
                <td style={{ padding: '12px 14px', fontWeight: 500, color: '#f8fafc' }}>
                  {vendor.name}
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
                  {formatInr(vendor.price)}
                </td>
                <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{vendor.includes || '—'}</td>
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
  );
};
