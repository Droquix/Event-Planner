/**
 * Tradeoff recalculation logic and surplus computation.
 */
import {
  ALL_CATEGORIES,
  MIN_CATERING_COST_PER_GUEST,
  MIN_CATEGORY_FLOOR_INR,
} from './constants';
import { getMinimumFloor } from './create';
import { validatePriorities } from './validate';
import type {
  BudgetCategory,
  BudgetChanges,
  BudgetDifference,
  BudgetPlan,
  CategoryAllocation,
  RecalculationResult,
} from './types';

/**
 * Cuts unprioritized categories down to the floor to absorb budget deficit.
 */
function cutUnprioritized(
  allocations: Record<BudgetCategory, CategoryAllocation>,
  oldAllocations: Record<BudgetCategory, CategoryAllocation>,
  canonicalPriorities: BudgetCategory[],
  minFloor: number,
  excess: number,
  differences: BudgetDifference[]
): number {
  let remainingExcess = excess;
  const order: BudgetCategory[] = [
    'misc',
    'entertainment',
    'decor',
    'venue',
    'photography',
    'catering',
  ];
  const unprioritized = ALL_CATEGORIES.filter((cat) => !canonicalPriorities.includes(cat)).sort(
    (a, b) => order.indexOf(a) - order.indexOf(b)
  );

  for (const cat of unprioritized) {
    if (remainingExcess <= 0) break;
    const currentAmount = allocations[cat].amount;
    const reducible = Math.max(0, currentAmount - minFloor);
    if (reducible <= 0) continue;

    const deduction = Math.min(reducible, remainingExcess);
    const newAmount = currentAmount - deduction;
    const oldAmount = oldAllocations[cat].amount;

    allocations[cat].amount = newAmount;
    remainingExcess -= deduction;

    differences.push({
      category: cat,
      oldAmount,
      newAmount,
      reason: `Reduced by ₹${deduction.toLocaleString('en-IN')} to absorb budget cut while maintaining 3% minimum floor and protecting higher priorities.`,
    });
  }

  return remainingExcess;
}

/**
 * Distributes remaining deficit across prioritized categories if necessary.
 */
function cutPrioritized(
  allocations: Record<BudgetCategory, CategoryAllocation>,
  oldAllocations: Record<BudgetCategory, CategoryAllocation>,
  canonicalPriorities: BudgetCategory[],
  minFloor: number,
  excess: number,
  differences: BudgetDifference[]
): void {
  const eligible = canonicalPriorities.filter((cat) => allocations[cat].amount > minFloor);
  const totalAboveFloor = eligible.reduce(
    (sum, cat) => sum + (allocations[cat].amount - minFloor),
    0
  );
  if (totalAboveFloor <= 0) return;

  let distributed = 0;
  for (let i = 0; i < eligible.length; i++) {
    const cat = eligible[i];
    const available = allocations[cat].amount - minFloor;
    const isLast = i === eligible.length - 1;
    const catCut = isLast
      ? Math.min(available, excess - distributed)
      : Math.min(available, Math.floor(excess * (available / totalAboveFloor)));

    distributed += catCut;
    const oldAmount = oldAllocations[cat].amount;
    const newAmount = allocations[cat].amount - catCut;
    allocations[cat].amount = newAmount;

    const existingIndex = differences.findIndex((d) => d.category === cat);
    if (existingIndex >= 0) {
      differences[existingIndex].newAmount = newAmount;
      differences[existingIndex].reason +=
        ' Then reduced to absorb budget cut while maintaining 3% minimum floor.';
    } else {
      differences.push({
        category: cat,
        oldAmount,
        newAmount,
        reason: `Reduced by ₹${catCut.toLocaleString('en-IN')} to absorb budget cut while protecting priority share.`,
      });
    }
  }
}

/**
 * Creates surplus explanation entry when budget expands or guests decrease.
 */
function buildSurplusDifference(
  surplusAmount: number,
  newGuests: number,
  plan: BudgetPlan,
  newBudget: number
): BudgetDifference {
  let reason = `Surplus of ₹${surplusAmount.toLocaleString('en-IN')} available from increased total budget.`;
  let suggestedUse =
    'Consider allocating additional funds to high-priority categories like catering or photography.';

  if (newGuests < plan.guestCount && newBudget > plan.totalBudget) {
    reason = `Surplus of ₹${surplusAmount.toLocaleString('en-IN')} generated from guest reduction and budget increase.`;
    suggestedUse =
      'Upgrade menu offerings, add premium photography/videography drone coverage, or keep as an unallocated safety reserve.';
  } else if (newGuests < plan.guestCount) {
    reason = `Surplus of ₹${surplusAmount.toLocaleString('en-IN')} saved from guest count reduction (${plan.guestCount - newGuests} fewer guests).`;
    suggestedUse =
      'Consider upgrading catering menu quality, booking live entertainment, or holding as contingency reserve.';
  }

  return {
    category: 'surplus',
    oldAmount: 0,
    newAmount: surplusAmount,
    reason,
    suggestedUse,
  };
}

/**
 * Recalculates an existing budget plan when guest count or total budget changes.
 */
export function recalculate(plan: BudgetPlan, changes: BudgetChanges): RecalculationResult {
  const newBudget = changes.totalBudget ?? plan.totalBudget;
  const newGuests = changes.guestCount ?? plan.guestCount;
  const newPriorities = changes.priorities ?? plan.priorities;

  if (!Number.isFinite(newBudget) || newBudget <= 0) {
    throw new Error('New total budget must be greater than zero.');
  }
  if (!Number.isFinite(newGuests) || newGuests < 1) {
    throw new Error('New guest count must be at least 1.');
  }

  const canonicalPriorities = validatePriorities(newPriorities);
  const warnings: string[] = [];
  const minFloor = getMinimumFloor(newBudget);
  const totalFloors = Math.max(
    minFloor * ALL_CATEGORIES.length,
    MIN_CATEGORY_FLOOR_INR * ALL_CATEGORIES.length
  );

  if (newBudget < totalFloors) {
    warnings.push(
      `Budget of ₹${newBudget.toLocaleString('en-IN')} is too small to satisfy minimum category floors (requires at least ₹${totalFloors.toLocaleString('en-IN')}).`
    );
  }

  const updated: Record<BudgetCategory, CategoryAllocation> = {
    venue: { ...plan.allocations.venue },
    catering: { ...plan.allocations.catering },
    decor: { ...plan.allocations.decor },
    photography: { ...plan.allocations.photography },
    entertainment: { ...plan.allocations.entertainment },
    misc: { ...plan.allocations.misc },
  };

  const differences: BudgetDifference[] = [];

  // 1. Adjust catering if guests changed
  const oldPerGuest =
    plan.allocations.catering.perGuestAmount ?? plan.allocations.catering.amount / plan.guestCount;

  if (newGuests !== plan.guestCount) {
    const targetCatering = Math.max(minFloor, Math.round(oldPerGuest * newGuests));
    const oldCatering = plan.allocations.catering.amount;
    updated.catering.amount = targetCatering;
    updated.catering.perGuestAmount = oldPerGuest;

    const guestDiff = Math.abs(newGuests - plan.guestCount);
    const isIncrease = newGuests > plan.guestCount;
    differences.push({
      category: 'catering',
      oldAmount: oldCatering,
      newAmount: targetCatering,
      reason: isIncrease
        ? `Increased catering cost for ${guestDiff} additional guests (₹${oldPerGuest.toLocaleString('en-IN')}/guest).`
        : `Decreased catering cost due to ${guestDiff} fewer guests (saving ₹${oldPerGuest.toLocaleString('en-IN')}/guest).`,
    });
  }

  // 2. Adjust for total budget difference
  const currentTotal = ALL_CATEGORIES.reduce((sum, cat) => sum + updated[cat].amount, 0);
  let surplusAmount: number | undefined;

  if (currentTotal > newBudget) {
    const excess = currentTotal - newBudget;
    const remainingExcess = cutUnprioritized(
      updated,
      plan.allocations,
      canonicalPriorities,
      minFloor,
      excess,
      differences
    );

    if (remainingExcess > 0 && canonicalPriorities.length > 0) {
      cutPrioritized(
        updated,
        plan.allocations,
        canonicalPriorities,
        minFloor,
        remainingExcess,
        differences
      );
    }

    const finalSum = ALL_CATEGORIES.reduce((sum, cat) => sum + updated[cat].amount, 0);
    const roundingDiff = newBudget - finalSum;
    if (roundingDiff !== 0 && canonicalPriorities.length > 0) {
      updated[canonicalPriorities[0]].amount += roundingDiff;
    }
  } else if (currentTotal < newBudget) {
    surplusAmount = newBudget - currentTotal;
    differences.push(buildSurplusDifference(surplusAmount, newGuests, plan, newBudget));
  }

  // 3. Final metrics & warnings
  for (const cat of ALL_CATEGORIES) {
    const amount = updated[cat].amount;
    updated[cat].percentage = newBudget > 0 ? Math.round((amount / newBudget) * 1000) / 10 : 0;
    if (updated[cat].costType === 'per-guest') {
      updated[cat].perGuestAmount =
        newGuests > 0 ? Math.round((amount / newGuests) * 100) / 100 : 0;
    }
  }

  const finalCateringPerGuest = updated.catering.amount / newGuests;
  if (finalCateringPerGuest < MIN_CATERING_COST_PER_GUEST) {
    warnings.push(
      `Catering budget is only ₹${Math.round(finalCateringPerGuest).toLocaleString('en-IN')} per guest, which is below the recommended minimum of ₹${MIN_CATERING_COST_PER_GUEST.toLocaleString('en-IN')} per guest. Consider increasing the total budget or reducing the guest count.`
    );
  }

  const newPlan: BudgetPlan = {
    totalBudget: newBudget,
    guestCount: newGuests,
    occasion: plan.occasion,
    priorities: newPriorities,
    allocations: updated,
    ...(surplusAmount !== undefined ? { surplus: surplusAmount } : {}),
    ...(warnings.length > 0 ? { warnings } : {}),
  };

  return {
    plan: newPlan,
    differences,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
