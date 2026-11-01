/**
 * Initial budget distribution logic and weighting algorithms.
 */
import {
  ALL_CATEGORIES,
  BASELINE_WEIGHTS,
  MIN_CATERING_COST_PER_GUEST,
  MIN_CATEGORY_FLOOR_INR,
  MIN_CATEGORY_FLOOR_RATE,
} from './constants';
import { getCostType, validatePriorities } from './validate';
import type {
  BudgetCategory,
  BudgetPlan,
  CategoryAllocation,
  CreateBudgetInput,
} from './types';

/**
 * Computes minimum category floor in INR for a given budget.
 */
export function getMinimumFloor(budget: number): number {
  return Math.max(1, Math.floor(budget * MIN_CATEGORY_FLOOR_RATE));
}

/**
 * Computes normalized weights boosted by user priorities.
 */
export function calculatePriorityWeights(
  canonicalPriorities: BudgetCategory[]
): Record<BudgetCategory, number> {
  const weights: Record<BudgetCategory, number> = { ...BASELINE_WEIGHTS };
  canonicalPriorities.forEach((cat, index) => {
    const boostMultiplier = 1 + Math.max(0.15, 0.5 - index * 0.15);
    weights[cat] *= boostMultiplier;
  });

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const normalized = {} as Record<BudgetCategory, number>;
  for (const cat of ALL_CATEGORIES) {
    normalized[cat] = weights[cat] / totalWeight;
  }
  return normalized;
}

/**
 * Helper to build initial category allocations.
 */
function buildInitialAllocations(
  totalBudget: number,
  guestCount: number,
  weights: Record<BudgetCategory, number>,
  minFloor: number
): { allocations: Record<BudgetCategory, CategoryAllocation>; allocatedSum: number } {
  const allocations = {} as Record<BudgetCategory, CategoryAllocation>;
  let allocatedSum = 0;

  for (const cat of ALL_CATEGORIES) {
    const calculatedAmount = Math.floor(totalBudget * weights[cat]);
    const amount = Math.max(minFloor, calculatedAmount);
    const costType = getCostType(cat);
    const perGuestAmount =
      costType === 'per-guest' ? Math.round((amount / guestCount) * 100) / 100 : undefined;

    allocations[cat] = {
      category: cat,
      amount,
      percentage: Math.round((amount / totalBudget) * 1000) / 10,
      costType,
      perGuestAmount,
    };
    allocatedSum += amount;
  }

  return { allocations, allocatedSum };
}

/**
 * Creates a new budget plan split into 6 core categories.
 */
export function createBudgetPlan(input: CreateBudgetInput): BudgetPlan {
  const { totalBudget, guestCount, occasion, priorities = [] } = input;
  if (!Number.isFinite(totalBudget) || totalBudget <= 0) {
    throw new Error('Total budget must be greater than zero.');
  }
  if (!Number.isFinite(guestCount) || guestCount < 1) {
    throw new Error('Guest count must be at least 1.');
  }

  const canonicalPriorities = validatePriorities(priorities);
  const warnings: string[] = [];
  const minFloor = getMinimumFloor(totalBudget);
  const totalFloors = Math.max(
    minFloor * ALL_CATEGORIES.length,
    MIN_CATEGORY_FLOOR_INR * ALL_CATEGORIES.length
  );

  if (totalBudget < totalFloors) {
    warnings.push(
      `Budget of ₹${totalBudget.toLocaleString('en-IN')} is too small to satisfy minimum category floors (requires at least ₹${totalFloors.toLocaleString('en-IN')}). Allocations may not sustain realistic event standards.`
    );
  }

  const weights = calculatePriorityWeights(canonicalPriorities);
  const { allocations, allocatedSum } = buildInitialAllocations(
    totalBudget,
    guestCount,
    weights,
    minFloor
  );

  if (totalBudget >= allocatedSum) {
    const remainder = totalBudget - allocatedSum;
    allocations.misc.amount += remainder;
    allocations.misc.percentage = Math.round((allocations.misc.amount / totalBudget) * 1000) / 10;
  }

  const cateringPerGuest = allocations.catering.amount / guestCount;
  if (cateringPerGuest < MIN_CATERING_COST_PER_GUEST) {
    warnings.push(
      `Catering budget is only ₹${Math.round(cateringPerGuest).toLocaleString('en-IN')} per guest, which is below the recommended minimum of ₹${MIN_CATERING_COST_PER_GUEST.toLocaleString('en-IN')} per guest. Consider increasing the total budget or reducing the guest count.`
    );
  }

  return {
    totalBudget,
    guestCount,
    occasion,
    priorities,
    allocations,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
