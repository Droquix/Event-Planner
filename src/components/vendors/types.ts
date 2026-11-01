import type { BudgetCategory } from '../../lib/budget';

export interface VendorQuote {
  id: string;
  name: string;
  category: BudgetCategory;
  price: number;
  includes: string;
  checklist: Record<string, boolean>;
}

export const REQUIRED_CHECKLIST = [
  'Itemized taxes/GST included',
  'Overtime hourly rate agreed',
  'Setup & teardown hours covered',
  'Advance & cancellation policy clear',
  'Backup plan for rain/power outage',
  'Breakage/security deposit documented',
  'Final guest count deadline agreed',
];

export const CAT_LABELS: Record<BudgetCategory, string> = {
  venue: 'Venue',
  catering: 'Catering',
  decor: 'Decor',
  photography: 'Photography',
  entertainment: 'Entertainment',
  misc: 'Miscellaneous',
};

export const CATEGORIES: BudgetCategory[] = [
  'venue',
  'catering',
  'decor',
  'photography',
  'entertainment',
  'misc',
];

export function formatInr(val: number): string {
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

export const inputStyle: React.CSSProperties = {
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
