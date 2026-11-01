/**
 * Pure domain types for budget management and allocation calculations.
 */

export type BudgetCategory =
  | 'venue'
  | 'catering'
  | 'decor'
  | 'photography'
  | 'entertainment'
  | 'misc';

export type CostType = 'per-guest' | 'fixed';

export interface CategoryAllocation {
  category: BudgetCategory;
  amount: number;
  percentage: number;
  costType: CostType;
  perGuestAmount?: number;
}

export interface BudgetPlan {
  totalBudget: number;
  guestCount: number;
  occasion: string;
  priorities: string[];
  allocations: Record<BudgetCategory, CategoryAllocation>;
  surplus?: number;
  warnings?: string[];
}

export interface BudgetDifference {
  category: BudgetCategory | 'surplus';
  oldAmount: number;
  newAmount: number;
  reason: string;
  suggestedUse?: string;
}

export interface RecalculationResult {
  plan: BudgetPlan;
  differences: BudgetDifference[];
  warnings?: string[];
}

export interface CreateBudgetInput {
  totalBudget: number;
  guestCount: number;
  occasion: string;
  priorities?: string[];
}

export interface BudgetChanges {
  guestCount?: number;
  totalBudget?: number;
  priorities?: string[];
}
