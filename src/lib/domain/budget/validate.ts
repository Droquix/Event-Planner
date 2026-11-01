/**
 * Priority string validation and category normalization.
 */
import { CATEGORY_ALIASES } from './constants';
import type { BudgetCategory, CostType } from './types';

/**
 * Normalizes user-supplied priority strings into recognized BudgetCategory names.
 */
export function normalizeCategory(name: string): BudgetCategory | null {
  const clean = name.trim().toLowerCase();
  return CATEGORY_ALIASES[clean] ?? null;
}

/**
 * Validates a list of priority strings, throwing a clear error if any priority is unrecognized.
 */
export function validatePriorities(priorities: string[]): BudgetCategory[] {
  const canonicalPriorities: BudgetCategory[] = [];
  for (const p of priorities) {
    const cat = normalizeCategory(p);
    if (!cat) {
      throw new Error(
        `Unknown priority: "${p}". Valid priorities are: venue, catering (or food), decor, photography, entertainment, misc.`
      );
    }
    if (!canonicalPriorities.includes(cat)) {
      canonicalPriorities.push(cat);
    }
  }
  return canonicalPriorities;
}

/**
 * Determines whether a category has per-guest or fixed pricing.
 */
export function getCostType(category: BudgetCategory): CostType {
  return category === 'catering' ? 'per-guest' : 'fixed';
}
