import React from 'react';
import { Card } from '../ui';
import { DotsIcon } from '../icons';
import { ALL_CATEGORIES, BudgetPlan } from '../../lib/budget';
import { formatInr } from './types';

export interface BudgetBreakdownTableProps {
  plan: BudgetPlan;
}

export const BudgetBreakdownTable: React.FC<BudgetBreakdownTableProps> = ({ plan }) => {
  const surplus = plan.surplus ?? 0;

  return (
    <Card style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 18,
        }}
      >
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Budget breakdown — ₹{Number(plan.totalBudget).toLocaleString('en-IN')} ·{' '}
            {plan.guestCount} guests
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
            A balanced baseline, ready for your input.
          </p>
        </div>
        <div style={{ color: '#64748b', cursor: 'pointer', padding: 4 }}>
          <DotsIcon size={16} color="#64748b" />
        </div>
      </div>

      <table
        role="table"
        aria-label="Budget allocation by category"
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
      >
        <thead>
          <tr>
            {['CATEGORY', 'AMOUNT', 'SHARE', 'PRICING TYPE', 'PER-GUEST COST'].map((h) => (
              <th
                key={h}
                scope="col"
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: '#64748b',
                  fontWeight: 600,
                  fontSize: 11,
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
          {ALL_CATEGORIES.map((cat) => {
            const alloc = plan.allocations[cat];
            const catTitle = cat.charAt(0).toUpperCase() + cat.slice(1);
            const pricingTypeFormatted = alloc.costType === 'per-guest' ? 'Per-guest' : 'Fixed';
            const perGuestFormatted = alloc.perGuestAmount
              ? `₹${alloc.perGuestAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—';

            return (
              <tr key={cat} style={{ borderBottom: '1px solid #141f33' }}>
                <td style={{ padding: '13px 14px', fontWeight: 500, color: '#f8fafc' }}>
                  {catTitle}
                </td>
                <td style={{ padding: '13px 14px', color: '#38bdf8', fontWeight: 700 }}>
                  ₹{alloc.amount.toLocaleString('en-IN')}
                </td>
                <td style={{ padding: '13px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      role="progressbar"
                      aria-valuenow={alloc.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${cat} share ${alloc.percentage}%`}
                      style={{
                        width: 48,
                        height: 5,
                        background: '#1e293b',
                        borderRadius: 9999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${alloc.percentage}%`,
                          height: '100%',
                          background: '#60a5fa',
                          borderRadius: 9999,
                        }}
                      />
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{alloc.percentage}%</span>
                  </div>
                </td>
                <td style={{ padding: '13px 14px', color: '#94a3b8' }}>{pricingTypeFormatted}</td>
                <td style={{ padding: '13px 14px', color: '#94a3b8' }}>{perGuestFormatted}</td>
              </tr>
            );
          })}
        </tbody>
        {surplus > 0 && (
          <tfoot>
            <tr style={{ borderTop: '2px solid #1e293b' }}>
              <td colSpan={5} style={{ padding: '12px 14px' }}>
                <span style={{ color: '#86efac', fontWeight: 700 }}>
                  💰 Surplus reserve: {formatInr(surplus)}
                </span>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </Card>
  );
};
