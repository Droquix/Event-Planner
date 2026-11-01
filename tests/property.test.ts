import { describe, it, expect } from 'vitest';
import {
  createBudgetPlan,
  recalculate,
  ALL_CATEGORIES,
  MIN_CATEGORY_FLOOR_INR,
  MIN_CATERING_COST_PER_GUEST,
} from '../src/lib/budget';

describe('Budget Invariant Property Tests (100 Iterations)', () => {
  it('strictly satisfies financial invariants across 100 random guest/budget combinations', () => {
    for (let i = 0; i < 100; i++) {
      // Guest count: 1 to 500
      const initialGuests = Math.floor(Math.random() * 500) + 1;
      // Budget: 50k to 50L, scaled so realistic per-guest food allocation is achievable
      const minViableBudget = Math.max(50000, initialGuests * 1500);
      const initialBudget =
        minViableBudget >= 5000000
          ? 5000000
          : Math.floor(Math.random() * (5000000 - minViableBudget)) + minViableBudget;

      const initialPlan = createBudgetPlan({
        totalBudget: initialBudget,
        guestCount: initialGuests,
        occasion: 'wedding',
        priorities: ['food', 'photography'],
      });

      // Recalculate with new random guest count and budget
      const newGuests = Math.floor(Math.random() * 500) + 1;
      const minNewViableBudget = Math.max(50000, newGuests * 1500);
      const newBudget =
        minNewViableBudget >= 5000000
          ? 5000000
          : Math.floor(Math.random() * (5000000 - minNewViableBudget)) + minNewViableBudget;

      const { plan: recalculatedPlan } = recalculate(initialPlan, {
        guestCount: newGuests,
        totalBudget: newBudget,
      });

      // Invariant 1: Sum of allocations + surplus equals totalBudget (within rounding margin of 2 INR)
      const allocationSum = ALL_CATEGORIES.reduce(
        (sum, cat) => sum + recalculatedPlan.allocations[cat].amount,
        0
      );
      const surplus = recalculatedPlan.surplus ?? 0;
      const totalComputed = allocationSum + surplus;

      expect(Math.abs(totalComputed - newBudget)).toBeLessThanOrEqual(2);

      // Invariant 2: No category allocation falls below its minimum absolute floor
      for (const cat of ALL_CATEGORIES) {
        expect(recalculatedPlan.allocations[cat].amount).toBeGreaterThanOrEqual(
          MIN_CATEGORY_FLOOR_INR
        );
      }

      // Invariant 3: Catering per-guest cost >= 500 when guests > 0 and budget is viable
      const cateringAmount = recalculatedPlan.allocations.catering.amount;
      const cateringPerGuest = cateringAmount / newGuests;
      expect(cateringPerGuest).toBeGreaterThanOrEqual(MIN_CATERING_COST_PER_GUEST);
    }
  });

  it('guarantees budget preservation even under extreme 90% budget slash', () => {
    const plan = createBudgetPlan({
      totalBudget: 2500000,
      guestCount: 200,
      occasion: 'wedding',
      priorities: ['food'],
    });

    const slashed = recalculate(plan, { totalBudget: 250000 });
    const allocationSum = ALL_CATEGORIES.reduce(
      (sum, cat) => sum + slashed.plan.allocations[cat].amount,
      0
    );
    expect(allocationSum + (slashed.plan.surplus ?? 0)).toBe(250000);

    for (const cat of ALL_CATEGORIES) {
      expect(slashed.plan.allocations[cat].amount).toBeGreaterThanOrEqual(MIN_CATEGORY_FLOOR_INR);
    }
  });
});
