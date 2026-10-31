/**
 * Budget planning and recalculation logic for event management.
 * All amounts are represented in Indian Rupees (INR).
 */

export type BudgetCategory =
  | 'venue'
  | 'catering'
  | 'decor'
  | 'photography'
  | 'entertainment'
  | 'misc';

export type CostType = 'per-guest' | 'fixed';

// Minimum floor rate for each category (3% of total budget)
export const MIN_CATEGORY_FLOOR_RATE = 0.03;
// Minimum floor in INR per category to ensure non-zero allocations
export const MIN_CATEGORY_FLOOR_INR = 50;

// Minimum acceptable catering cost per guest in INR.
// This is a rough market estimate for a basic sit-down meal at an Indian event
// (includes food, service, and basic crockery). Adjust as costs change over time.
export const MIN_CATERING_COST_PER_GUEST = 500;

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

// All canonical categories in default fallback order
export const ALL_CATEGORIES: BudgetCategory[] = [
  'venue',
  'catering',
  'decor',
  'photography',
  'entertainment',
  'misc',
];

// Baseline percentage distribution for standard events (sums to 100%)
const BASELINE_WEIGHTS: Record<BudgetCategory, number> = {
  venue: 0.25,
  catering: 0.30,
  decor: 0.15,
  photography: 0.12,
  entertainment: 0.10,
  misc: 0.08,
};

// Map common synonyms to canonical category names
const CATEGORY_ALIASES: Record<string, BudgetCategory> = {
  food: 'catering',
  catering: 'catering',
  dinner: 'catering',
  drinks: 'catering',
  photos: 'photography',
  photo: 'photography',
  photography: 'photography',
  video: 'photography',
  videography: 'photography',
  decor: 'decor',
  decoration: 'decor',
  decorations: 'decor',
  flowers: 'decor',
  venue: 'venue',
  hall: 'venue',
  location: 'venue',
  entertainment: 'entertainment',
  music: 'entertainment',
  dj: 'entertainment',
  band: 'entertainment',
  misc: 'misc',
  miscellaneous: 'misc',
  buffer: 'misc',
  other: 'misc',
};

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
 * Catering scales directly with guest headcount; other categories are fixed.
 */
export function getCostType(category: BudgetCategory): CostType {
  return category === 'catering' ? 'per-guest' : 'fixed';
}

/**
 * Calculates category weights boosted by the user's priorities.
 * High priority items get larger multipliers, then weights are normalized to 100%.
 */
function calculatePriorityWeights(canonicalPriorities: BudgetCategory[]): Record<BudgetCategory, number> {
  const weights: Record<BudgetCategory, number> = { ...BASELINE_WEIGHTS };
  canonicalPriorities.forEach((cat, index) => {
    const boostMultiplier = 1 + Math.max(0.15, 0.50 - index * 0.15);
    weights[cat] *= boostMultiplier;
  });

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const normalizedWeights = {} as Record<BudgetCategory, number>;
  for (const cat of ALL_CATEGORIES) {
    normalizedWeights[cat] = weights[cat] / totalWeight;
  }

  return normalizedWeights;
}

/**
 * Computes minimum floor in INR for a given budget.
 */
function getMinimumFloor(budget: number): number {
  return Math.max(1, Math.floor(budget * MIN_CATEGORY_FLOOR_RATE));
}

/**
 * Creates a new budget plan split into 6 core categories.
 * Enforces input validations, category floors (minimum 3%), and priority weighting.
 */
export function createBudgetPlan(input: CreateBudgetInput): BudgetPlan {
  const { totalBudget, guestCount, occasion, priorities = [] } = input;

  if (totalBudget <= 0) {
    throw new Error('Total budget must be greater than zero.');
  }
  if (guestCount < 1) {
    throw new Error('Guest count must be at least 1.');
  }

  const canonicalPriorities = validatePriorities(priorities);

  const warnings: string[] = [];
  const minFloor = getMinimumFloor(totalBudget);
  const totalFloorsRequired = Math.max(
    minFloor * ALL_CATEGORIES.length,
    MIN_CATEGORY_FLOOR_INR * ALL_CATEGORIES.length
  );

  if (totalBudget < totalFloorsRequired) {
    warnings.push(
      `Budget of ₹${totalBudget.toLocaleString('en-IN')} is too small to satisfy minimum category floors (requires at least ₹${totalFloorsRequired.toLocaleString('en-IN')}). Allocations may not sustain realistic event standards.`
    );
  }

  const weights = calculatePriorityWeights(canonicalPriorities);
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

  if (totalBudget >= allocatedSum) {
    const remainder = totalBudget - allocatedSum;
    allocations.misc.amount += remainder;
    allocations.misc.percentage =
      Math.round((allocations.misc.amount / totalBudget) * 1000) / 10;
  }

  // Warn when the computed catering budget divided by guest count falls below the
  // configured minimum — this signals the food budget is unrealistically low.
  const cateringPerGuest = allocations.catering.amount / guestCount;
  if (cateringPerGuest < MIN_CATERING_COST_PER_GUEST) {
    warnings.push(
      `Catering budget is only ₹${Math.round(cateringPerGuest).toLocaleString('en-IN')} per guest, ` +
      `which is below the recommended minimum of ₹${MIN_CATERING_COST_PER_GUEST.toLocaleString('en-IN')} per guest. ` +
      `Consider increasing the total budget or reducing the guest count.`
    );
  }

  const plan: BudgetPlan = {
    totalBudget,
    guestCount,
    occasion,
    priorities,
    allocations,
  };

  if (warnings.length > 0) {
    plan.warnings = warnings;
  }

  return plan;
}

/**
 * Recalculates an existing budget plan when guest count or total budget changes.
 * Preserves minimum 3% floor for every category so no category drops to zero or below.
 * When money is saved (guests reduced or budget raised), reports it as a "surplus" entry
 * with suggested uses instead of silently adding it to misc.
 */
export function recalculate(
  plan: BudgetPlan,
  changes: BudgetChanges
): RecalculationResult {
  const newBudget = changes.totalBudget ?? plan.totalBudget;
  const newGuests = changes.guestCount ?? plan.guestCount;
  const newPriorities = changes.priorities ?? plan.priorities;

  if (newBudget <= 0) {
    throw new Error('New total budget must be greater than zero.');
  }
  if (newGuests < 1) {
    throw new Error('New guest count must be at least 1.');
  }

  const canonicalPriorities = validatePriorities(newPriorities);
  const warnings: string[] = [];

  const minFloor = getMinimumFloor(newBudget);
  const totalFloorsRequired = Math.max(
    minFloor * ALL_CATEGORIES.length,
    MIN_CATEGORY_FLOOR_INR * ALL_CATEGORIES.length
  );

  if (newBudget < totalFloorsRequired) {
    warnings.push(
      `Budget of ₹${newBudget.toLocaleString('en-IN')} is too small to satisfy minimum category floors (requires at least ₹${totalFloorsRequired.toLocaleString('en-IN')}).`
    );
  }

  const updatedAllocations: Record<BudgetCategory, CategoryAllocation> = {
    venue: { ...plan.allocations.venue },
    catering: { ...plan.allocations.catering },
    decor: { ...plan.allocations.decor },
    photography: { ...plan.allocations.photography },
    entertainment: { ...plan.allocations.entertainment },
    misc: { ...plan.allocations.misc },
  };

  const differences: BudgetDifference[] = [];

  // Step 1: Adjust per-guest catering cost if guest count changed
  const oldPerGuest =
    plan.allocations.catering.perGuestAmount ??
    plan.allocations.catering.amount / plan.guestCount;

  if (newGuests !== plan.guestCount) {
    const targetCatering = Math.max(minFloor, Math.round(oldPerGuest * newGuests));
    const oldCatering = plan.allocations.catering.amount;

    updatedAllocations.catering.amount = targetCatering;
    updatedAllocations.catering.perGuestAmount = oldPerGuest;

    if (newGuests > plan.guestCount) {
      differences.push({
        category: 'catering',
        oldAmount: oldCatering,
        newAmount: targetCatering,
        reason: `Increased catering cost for ${newGuests - plan.guestCount} additional guests (₹${oldPerGuest.toLocaleString('en-IN')}/guest).`,
      });
    } else {
      differences.push({
        category: 'catering',
        oldAmount: oldCatering,
        newAmount: targetCatering,
        reason: `Decreased catering cost due to ${plan.guestCount - newGuests} fewer guests (saving ₹${oldPerGuest.toLocaleString('en-IN')}/guest).`,
      });
    }
  }

  // Step 2: Compare total allocations against new budget
  const currentTotal = ALL_CATEGORIES.reduce(
    (sum, cat) => sum + updatedAllocations[cat].amount,
    0
  );

  let surplusAmount: number | undefined = undefined;

  if (currentTotal > newBudget) {
    let excess = currentTotal - newBudget;

    // Unprioritized categories are cut first (misc -> entertainment -> decor -> venue)
    const unprioritized = ALL_CATEGORIES.filter(
      (cat) => !canonicalPriorities.includes(cat)
    ).sort((a, b) => {
      const order: BudgetCategory[] = [
        'misc',
        'entertainment',
        'decor',
        'venue',
        'photography',
        'catering',
      ];
      return order.indexOf(a) - order.indexOf(b);
    });

    // Reduce unprioritized categories down to the 3% floor
    for (const cat of unprioritized) {
      if (excess <= 0) break;
      const currentAmount = updatedAllocations[cat].amount;
      const reducible = Math.max(0, currentAmount - minFloor);
      if (reducible <= 0) continue;

      const deduction = Math.min(reducible, excess);
      const newAmount = currentAmount - deduction;
      const oldAmount = plan.allocations[cat].amount;

      updatedAllocations[cat].amount = newAmount;
      excess -= deduction;

      differences.push({
        category: cat,
        oldAmount,
        newAmount,
        reason: `Reduced by ₹${deduction.toLocaleString('en-IN')} to absorb budget cut while maintaining 3% minimum floor and protecting higher priorities.`,
      });
    }

    // If excess remains (severe cut, like 90%), distribute cuts among prioritized categories,
    // ensuring ALL prioritized categories retain above-floor shares proportionally to their priority
    if (excess > 0 && canonicalPriorities.length > 0) {
      const prioritizedCategories = canonicalPriorities.filter(
        (cat) => updatedAllocations[cat].amount > minFloor
      );

      const totalPrioritizedAboveFloor = prioritizedCategories.reduce(
        (sum, cat) => sum + (updatedAllocations[cat].amount - minFloor),
        0
      );

      if (totalPrioritizedAboveFloor > 0) {
        // Distribute remaining excess cut proportionally among prioritized categories
        let distributedExcess = 0;
        for (let i = 0; i < prioritizedCategories.length; i++) {
          const cat = prioritizedCategories[i];
          const availableAboveFloor = updatedAllocations[cat].amount - minFloor;
          // Priority ranking weighting: higher priority items take smaller share of remaining cut
          const priorityRank = canonicalPriorities.indexOf(cat);
          const cutWeight = Math.max(0.2, 1 - 0.4 * (canonicalPriorities.length - 1 - priorityRank));

          let catCut =
            i === prioritizedCategories.length - 1
              ? excess - distributedExcess
              : Math.min(
                  availableAboveFloor,
                  Math.floor((excess * (availableAboveFloor / totalPrioritizedAboveFloor)))
                );

          // Ensure it does not exceed available above floor
          catCut = Math.min(availableAboveFloor, Math.max(0, catCut));
          distributedExcess += catCut;

          const oldAmount = plan.allocations[cat].amount;
          const newAmount = updatedAllocations[cat].amount - catCut;
          updatedAllocations[cat].amount = newAmount;

          const existingDiffIndex = differences.findIndex((d) => d.category === cat);
          if (existingDiffIndex >= 0) {
            differences[existingDiffIndex].newAmount = newAmount;
            differences[existingDiffIndex].reason += ` Then reduced to absorb budget cut while maintaining 3% minimum floor.`;
          } else {
            differences.push({
              category: cat,
              oldAmount,
              newAmount,
              reason: `Reduced by ₹${catCut.toLocaleString('en-IN')} to absorb budget cut while protecting priority share.`,
            });
          }
        }
        excess -= distributedExcess;
      }
    }

    // Adjust any rounding discrepancy to ensure sum strictly equals newBudget if viable
    const finalSum = ALL_CATEGORIES.reduce(
      (sum, cat) => sum + updatedAllocations[cat].amount,
      0
    );
    const roundingDiff = newBudget - finalSum;
    if (roundingDiff !== 0 && canonicalPriorities.length > 0) {
      const topPriority = canonicalPriorities[0];
      updatedAllocations[topPriority].amount += roundingDiff;
    }
  } else if (currentTotal < newBudget) {
    // Whenever money is saved (guests reduced or budget raised), include it in the
    // differences list as a "surplus" entry with a suggested use, instead of silently adding it to misc.
    surplusAmount = newBudget - currentTotal;

    let reason = '';
    let suggestedUse = '';

    if (newGuests < plan.guestCount && newBudget > plan.totalBudget) {
      reason = `Surplus of ₹${surplusAmount.toLocaleString('en-IN')} generated from guest reduction and budget increase.`;
      suggestedUse =
        'Upgrade menu offerings, add premium photography/videography drone coverage, or keep as an unallocated safety reserve.';
    } else if (newGuests < plan.guestCount) {
      reason = `Surplus of ₹${surplusAmount.toLocaleString('en-IN')} saved from guest count reduction (${plan.guestCount - newGuests} fewer guests).`;
      suggestedUse =
        'Consider upgrading catering menu quality, booking live entertainment, or holding as contingency reserve.';
    } else {
      reason = `Surplus of ₹${surplusAmount.toLocaleString('en-IN')} available from increased total budget.`;
      suggestedUse =
        'Consider allocating additional funds to high-priority categories like catering or photography.';
    }

    differences.push({
      category: 'surplus',
      oldAmount: 0,
      newAmount: surplusAmount,
      reason,
      suggestedUse,
    });
  }

  // Step 3: Recompute final percentages and per-guest metrics
  for (const cat of ALL_CATEGORIES) {
    const amount = updatedAllocations[cat].amount;
    updatedAllocations[cat].percentage =
      newBudget > 0 ? Math.round((amount / newBudget) * 1000) / 10 : 0;
    if (updatedAllocations[cat].costType === 'per-guest') {
      updatedAllocations[cat].perGuestAmount =
        newGuests > 0 ? Math.round((amount / newGuests) * 100) / 100 : 0;
    }
  }

  // Warn when catering per-guest falls below the configured minimum after recalculation.
  const finalCateringPerGuest = updatedAllocations.catering.amount / newGuests;
  if (finalCateringPerGuest < MIN_CATERING_COST_PER_GUEST) {
    warnings.push(
      `Catering budget is only ₹${Math.round(finalCateringPerGuest).toLocaleString('en-IN')} per guest, ` +
      `which is below the recommended minimum of ₹${MIN_CATERING_COST_PER_GUEST.toLocaleString('en-IN')} per guest. ` +
      `Consider increasing the total budget or reducing the guest count.`
    );
  }

  const newPlan: BudgetPlan = {
    totalBudget: newBudget,
    guestCount: newGuests,
    occasion: plan.occasion,
    priorities: newPriorities,
    allocations: updatedAllocations,
    ...(surplusAmount !== undefined ? { surplus: surplusAmount } : {}),
    ...(warnings.length > 0 ? { warnings } : {}),
  };

  return {
    plan: newPlan,
    differences,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
