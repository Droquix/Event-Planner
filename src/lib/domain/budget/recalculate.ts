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

interface DeficitCutContext {
  allocations: Record<BudgetCategory, CategoryAllocation>;
  oldAllocations: Record<BudgetCategory, CategoryAllocation>;
  canonicalPriorities: BudgetCategory[];
  minFloor: number;
}

/**
 * Cuts unprioritized categories down to the floor to absorb budget deficit.
 */
function cutUnprioritized(ctx: DeficitCutContext, excess: number, diffs: BudgetDifference[]): number {
  let remainingExcess = excess;
  const order: BudgetCategory[] = [
    'misc',
    'entertainment',
    'decor',
    'venue',
    'photography',
    'catering',
  ];
  const unprioritized = ALL_CATEGORIES.filter((cat) => !ctx.canonicalPriorities.includes(cat)).sort(
    (a, b) => order.indexOf(a) - order.indexOf(b)
  );

  for (const cat of unprioritized) {
    if (remainingExcess <= 0) break;
    const currentAmount = ctx.allocations[cat].amount;
    const reducible = Math.max(0, currentAmount - ctx.minFloor);
    if (reducible <= 0) continue;

    const deduction = Math.min(reducible, remainingExcess);
    const newAmount = currentAmount - deduction;
    const oldAmount = ctx.oldAllocations[cat].amount;

    ctx.allocations[cat].amount = newAmount;
    remainingExcess -= deduction;

    diffs.push({
      category: cat,
      oldAmount,
      newAmount,
      reason: `Reduced by ₹${deduction.toLocaleString('en-IN')} to absorb budget cut while maintaining 3% minimum floor and protecting higher priorities.`,
    });
  }

  return remainingExcess;
}

/**
 * Distributes remaining deficit across prioritized categories proportionally.
 */
function cutPrioritized(ctx: DeficitCutContext, excess: number, diffs: BudgetDifference[]): void {
  const eligible = ctx.canonicalPriorities.filter((cat) => ctx.allocations[cat].amount > ctx.minFloor);
  const totalAboveFloor = eligible.reduce(
    (sum, cat) => sum + (ctx.allocations[cat].amount - ctx.minFloor),
    0
  );
  if (totalAboveFloor <= 0) return;

  let distributed = 0;
  for (let i = 0; i < eligible.length; i++) {
    const cat = eligible[i];
    const available = ctx.allocations[cat].amount - ctx.minFloor;
    const isLast = i === eligible.length - 1;
    const catCut = isLast
      ? Math.min(available, excess - distributed)
      : Math.min(available, Math.floor(excess * (available / totalAboveFloor)));

    distributed += catCut;
    const oldAmount = ctx.oldAllocations[cat].amount;
    const newAmount = ctx.allocations[cat].amount - catCut;
    ctx.allocations[cat].amount = newAmount;

    const existingIndex = diffs.findIndex((d) => d.category === cat);
    if (existingIndex >= 0) {
      diffs[existingIndex].newAmount = newAmount;
      diffs[existingIndex].reason += ' Then reduced to absorb budget cut while maintaining 3% minimum floor.';
    } else {
      diffs.push({
        category: cat,
        oldAmount,
        newAmount,
        reason: `Reduced by ₹${catCut.toLocaleString('en-IN')} to absorb budget cut while protecting priority share.`,
      });
    }
  }
}

function buildSurplusDifference(
  surplusAmount: number,
  newGuests: number,
  plan: BudgetPlan,
  newBudget: number
): BudgetDifference {
  const isGuestReduction = newGuests < plan.guestCount;
  const isBudgetIncrease = newBudget > plan.totalBudget;

  let reason = `Allocations totaled ₹${(newBudget - surplusAmount).toLocaleString('en-IN')}; ₹${surplusAmount.toLocaleString('en-IN')} unallocated surplus created.`;
  let suggestedUse = 'Can be used as a contingency buffer, upgraded decor, or live entertainment.';

  if (isGuestReduction && isBudgetIncrease) {
    reason = `Guest count reduced from ${plan.guestCount} to ${newGuests} (saving catering) and budget increased from ₹${plan.totalBudget.toLocaleString('en-IN')} to ₹${newBudget.toLocaleString('en-IN')}; unallocated surplus created.`;
    suggestedUse = 'Consider premium venue upgrades or hospitality enhancements with the extra buffer.';
  } else if (isGuestReduction) {
    const guestDiff = plan.guestCount - newGuests;
    reason = `Guest count reduced from ${plan.guestCount} to ${newGuests} (${guestDiff} fewer guests); unallocated surplus created.`;
    suggestedUse = 'Can be used for premium catering options or returned to contingency.';
  } else if (isBudgetIncrease) {
    reason = `Budget increased by ₹${(newBudget - plan.totalBudget).toLocaleString('en-IN')}; unallocated surplus available.`;
    suggestedUse = 'Can be allocated toward higher-tier vendors or unique guest experiences.';
  }

  return {
    category: 'surplus',
    oldAmount: 0,
    newAmount: surplusAmount,
    reason,
    suggestedUse,
  };
}

interface CateringContext {
  updated: Record<BudgetCategory, CategoryAllocation>;
  plan: BudgetPlan;
  newGuests: number;
  minFloor: number;
  diffs: BudgetDifference[];
}

/**
 * Adjusts catering allocation when guest count changes.
 */
function adjustCatering(ctx: CateringContext): void {
  const oldPerGuest =
    ctx.plan.allocations.catering.perGuestAmount ??
    ctx.plan.allocations.catering.amount / ctx.plan.guestCount;

  if (ctx.newGuests === ctx.plan.guestCount) return;

  const targetCatering = Math.max(ctx.minFloor, Math.round(oldPerGuest * ctx.newGuests));
  const oldCatering = ctx.plan.allocations.catering.amount;
  ctx.updated.catering.amount = targetCatering;
  ctx.updated.catering.perGuestAmount = oldPerGuest;

  const guestDiff = Math.abs(ctx.newGuests - ctx.plan.guestCount);
  const isIncrease = ctx.newGuests > ctx.plan.guestCount;
  ctx.diffs.push({
    category: 'catering',
    oldAmount: oldCatering,
    newAmount: targetCatering,
    reason: isIncrease
      ? `Increased catering cost for ${guestDiff} additional guests (₹${oldPerGuest.toLocaleString('en-IN')}/guest).`
      : `Decreased catering cost due to ${guestDiff} fewer guests (saving ₹${oldPerGuest.toLocaleString('en-IN')}/guest).`,
  });
}

/**
 * Recomputes percentages and per-guest metrics after recalculation.
 */
function finalizeAllocations(
  updated: Record<BudgetCategory, CategoryAllocation>,
  newBudget: number,
  newGuests: number
): void {
  for (const cat of ALL_CATEGORIES) {
    const amount = updated[cat].amount;
    updated[cat].percentage = newBudget > 0 ? Math.round((amount / newBudget) * 1000) / 10 : 0;
    if (updated[cat].costType === 'per-guest') {
      updated[cat].perGuestAmount =
        newGuests > 0 ? Math.round((amount / newGuests) * 100) / 100 : 0;
    }
  }
}

function handleDeficit(
  cutCtx: DeficitCutContext,
  deficit: number,
  differences: BudgetDifference[],
  newBudget: number
): void {
  const remaining = cutUnprioritized(cutCtx, deficit, differences);
  if (remaining > 0 && cutCtx.canonicalPriorities.length > 0) {
    cutPrioritized(cutCtx, remaining, differences);
  }
  const finalSum = ALL_CATEGORIES.reduce((sum, cat) => sum + cutCtx.allocations[cat].amount, 0);
  const roundingDiff = newBudget - finalSum;
  if (roundingDiff !== 0 && cutCtx.canonicalPriorities.length > 0) {
    cutCtx.allocations[cutCtx.canonicalPriorities[0]].amount += roundingDiff;
  }
}

function validateRecalculateInputs(changes: BudgetChanges, plan: BudgetPlan) {
  const newBudget = changes.totalBudget ?? plan.totalBudget;
  const newGuests = changes.guestCount ?? plan.guestCount;
  const newPriorities = changes.priorities ?? plan.priorities;

  if (!Number.isFinite(newBudget) || newBudget <= 0) {
    throw new Error('New total budget must be greater than zero.');
  }
  if (!Number.isFinite(newGuests) || newGuests < 1) {
    throw new Error('New guest count must be at least 1.');
  }

  return { newBudget, newGuests, newPriorities };
}

/**
 * Recalculates an existing budget plan when guest count or total budget changes.
 */
export function recalculate(plan: BudgetPlan, changes: BudgetChanges): RecalculationResult {
  const { newBudget, newGuests, newPriorities } = validateRecalculateInputs(changes, plan);
  const canonicalPriorities = validatePriorities(newPriorities);
  const warnings: string[] = [];
  const minFloor = getMinimumFloor(newBudget);
  const totalFloors = Math.max(minFloor * ALL_CATEGORIES.length, MIN_CATEGORY_FLOOR_INR * ALL_CATEGORIES.length);

  if (newBudget < totalFloors) {
    warnings.push(`Budget of ₹${newBudget.toLocaleString('en-IN')} is too small to satisfy minimum category floors (requires at least ₹${totalFloors.toLocaleString('en-IN')}).`);
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
  adjustCatering({ updated, plan, newGuests, minFloor, diffs: differences });

  const currentTotal = ALL_CATEGORIES.reduce((sum, cat) => sum + updated[cat].amount, 0);
  let surplusAmount: number | undefined;

  if (currentTotal > newBudget) {
    const cutCtx: DeficitCutContext = { allocations: updated, oldAllocations: plan.allocations, canonicalPriorities, minFloor };
    handleDeficit(cutCtx, currentTotal - newBudget, differences, newBudget);
  } else if (currentTotal < newBudget) {
    surplusAmount = newBudget - currentTotal;
    differences.push(buildSurplusDifference(surplusAmount, newGuests, plan, newBudget));
  }

  finalizeAllocations(updated, newBudget, newGuests);

  const cateringPerGuest = updated.catering.amount / newGuests;
  if (cateringPerGuest < MIN_CATERING_COST_PER_GUEST) {
    warnings.push(`Catering budget is only ₹${Math.round(cateringPerGuest).toLocaleString('en-IN')} per guest, which is below the recommended minimum of ₹${MIN_CATERING_COST_PER_GUEST.toLocaleString('en-IN')} per guest. Consider increasing the total budget or reducing the guest count.`);
  }

  return {
    plan: {
      totalBudget: newBudget,
      guestCount: newGuests,
      occasion: plan.occasion,
      priorities: newPriorities,
      allocations: updated,
      ...(surplusAmount !== undefined ? { surplus: surplusAmount } : {}),
      ...(warnings.length > 0 ? { warnings } : {}),
    },
    differences,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
