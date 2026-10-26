import { describe, it, expect } from 'vitest';
import {
  createBudgetPlan,
  recalculate,
  ALL_CATEGORIES,
  MIN_CATEGORY_FLOOR_RATE,
  type BudgetPlan,
} from '../src/lib/budget';

describe('Budget Planning Logic', () => {
  // Test 1: Normal case for budget creation
  it('creates an initial budget plan with all 6 categories, minimum floors, and correct cost types', () => {
    const plan = createBudgetPlan({
      totalBudget: 1_000_000,
      guestCount: 100,
      occasion: 'wedding',
      priorities: ['food', 'decor', 'photography'],
    });

    expect(plan.totalBudget).toBe(1_000_000);
    expect(plan.guestCount).toBe(100);
    expect(plan.occasion).toBe('wedding');

    const minFloor = 1_000_000 * MIN_CATEGORY_FLOOR_RATE; // 30,000 INR (3%)

    // Ensure all 6 categories exist and exceed the 3% minimum floor
    for (const cat of ALL_CATEGORIES) {
      expect(plan.allocations[cat]).toBeDefined();
      expect(plan.allocations[cat].amount).toBeGreaterThanOrEqual(minFloor);
    }

    // Catering should be per-guest; others should be fixed
    expect(plan.allocations.catering.costType).toBe('per-guest');
    expect(plan.allocations.catering.perGuestAmount).toBeGreaterThan(0);
    expect(plan.allocations.venue.costType).toBe('fixed');
    expect(plan.allocations.decor.costType).toBe('fixed');
    expect(plan.allocations.photography.costType).toBe('fixed');
    expect(plan.allocations.entertainment.costType).toBe('fixed');
    expect(plan.allocations.misc.costType).toBe('fixed');

    // Total allocation must equal the total budget exactly
    const sum = ALL_CATEGORIES.reduce(
      (acc, cat) => acc + plan.allocations[cat].amount,
      0
    );
    expect(sum).toBe(1_000_000);

    // Priorities should boost share:
    // Food (catering) should have a higher share than baseline without priorities
    const baselinePlan = createBudgetPlan({
      totalBudget: 1_000_000,
      guestCount: 100,
      occasion: 'wedding',
      priorities: [],
    });
    expect(plan.allocations.catering.amount).toBeGreaterThan(
      baselinePlan.allocations.catering.amount
    );
  });

  // Test 2: Guest count going up
  it('handles guest count going up, increases catering, and reduces lowest-priority categories while preserving minimum 3% floor', () => {
    const initialPlan = createBudgetPlan({
      totalBudget: 1_000_000,
      guestCount: 100,
      occasion: 'wedding',
      priorities: ['food', 'photography'], // catering and photography are protected
    });

    const oldCatering = initialPlan.allocations.catering.amount;
    const oldMisc = initialPlan.allocations.misc.amount;

    // Recalculate with 150 guests (+50% increase in guests)
    const { plan: newPlan, differences } = recalculate(initialPlan, {
      guestCount: 150,
    });

    // 1. Guest count updated
    expect(newPlan.guestCount).toBe(150);

    // 2. Catering cost should increase
    expect(newPlan.allocations.catering.amount).toBeGreaterThan(oldCatering);

    // 3. Category total must NEVER exceed total budget
    const newTotal = ALL_CATEGORIES.reduce(
      (sum, cat) => sum + newPlan.allocations[cat].amount,
      0
    );
    expect(newTotal).toBeLessThanOrEqual(initialPlan.totalBudget);
    expect(newTotal).toBe(initialPlan.totalBudget);

    // 4. Lowest-priority categories (misc, entertainment) must be reduced first, but stay >= 3% floor
    expect(newPlan.allocations.misc.amount).toBeLessThan(oldMisc);
    expect(newPlan.allocations.misc.amount).toBeGreaterThanOrEqual(1_000_000 * 0.03);

    // 5. Differences array must detail changes with explanations
    expect(differences.length).toBeGreaterThan(0);
    const cateringDiff = differences.find((d) => d.category === 'catering');
    expect(cateringDiff).toBeDefined();
    expect(cateringDiff?.newAmount).toBeGreaterThan(cateringDiff?.oldAmount ?? 0);
    expect(cateringDiff?.reason).toContain('additional guests');

    const miscDiff = differences.find((d) => d.category === 'misc');
    expect(miscDiff).toBeDefined();
    expect(miscDiff?.reason).toMatch(/reduced/i);

    // 6. Original plan must remain unmutated (purity check)
    expect(initialPlan.guestCount).toBe(100);
    expect(initialPlan.allocations.catering.amount).toBe(oldCatering);
  });

  // Test 3: Guest count going down produces a "surplus" entry with suggested use
  it('handles guest count going down, saves catering costs, and records a surplus entry with suggested use instead of silently adding to misc', () => {
    const initialPlan = createBudgetPlan({
      totalBudget: 1_000_000,
      guestCount: 100,
      occasion: 'wedding',
      priorities: ['food'],
    });

    const oldCatering = initialPlan.allocations.catering.amount;
    const oldMisc = initialPlan.allocations.misc.amount;

    // Recalculate with 70 guests (-30 guests)
    const { plan: newPlan, differences } = recalculate(initialPlan, {
      guestCount: 70,
    });

    expect(newPlan.guestCount).toBe(70);

    // Catering cost should decrease
    expect(newPlan.allocations.catering.amount).toBeLessThan(oldCatering);

    // Misc amount should NOT change silently
    expect(newPlan.allocations.misc.amount).toBe(oldMisc);

    // Plan should record the surplus
    expect(newPlan.surplus).toBeDefined();
    expect(newPlan.surplus).toBeGreaterThan(0);

    // Sum of category allocations plus surplus must equal total budget
    const categorySum = ALL_CATEGORIES.reduce(
      (sum, cat) => sum + newPlan.allocations[cat].amount,
      0
    );
    expect(categorySum + (newPlan.surplus ?? 0)).toBe(1_000_000);

    // Differences must include a "surplus" entry with suggested use
    const surplusDiff = differences.find((d) => d.category === 'surplus');
    expect(surplusDiff).toBeDefined();
    expect(surplusDiff?.newAmount).toBe(newPlan.surplus);
    expect(surplusDiff?.reason).toContain('fewer guests');
    expect(surplusDiff?.suggestedUse).toBeDefined();
    expect(surplusDiff?.suggestedUse?.length).toBeGreaterThan(10);
  });

  // Test 4: Budget cut by 30% with 3% minimum floor
  it('handles a 30% budget cut by reducing lowest-priority categories first while maintaining the 3% minimum floor', () => {
    const initialPlan = createBudgetPlan({
      totalBudget: 1_000_000,
      guestCount: 100,
      occasion: 'wedding',
      priorities: ['food', 'photography'], // high priorities to protect
    });

    // Budget cut by 30%: new budget is 700,000 INR
    const { plan: newPlan, differences } = recalculate(initialPlan, {
      totalBudget: 700_000,
    });

    expect(newPlan.totalBudget).toBe(700_000);

    // Category total must NEVER exceed the new budget
    const newTotal = ALL_CATEGORIES.reduce(
      (sum, cat) => sum + newPlan.allocations[cat].amount,
      0
    );
    expect(newTotal).toBe(700_000);

    const minFloor3Percent = 700_000 * 0.03; // 21,000 INR

    // Every category must be >= 3% floor, none can be 0 or below
    for (const cat of ALL_CATEGORIES) {
      expect(newPlan.allocations[cat].amount).toBeGreaterThanOrEqual(minFloor3Percent);
      expect(newPlan.allocations[cat].amount).toBeGreaterThan(0);
    }

    // High priority categories (catering, photography) retain larger relative shares
    expect(newPlan.allocations.catering.amount).toBeGreaterThan(minFloor3Percent);
    expect(newPlan.allocations.photography.amount).toBeGreaterThan(minFloor3Percent);

    // All differences must explain the budget reduction
    expect(differences.length).toBeGreaterThan(0);
    for (const diff of differences) {
      expect(diff.reason).toMatch(/budget cut|reduced/i);
    }
  });

  // Test 5: 90% budget cut
  it('handles a severe 90% budget cut so no category drops to zero or below (all satisfy 3% floor)', () => {
    const initialPlan = createBudgetPlan({
      totalBudget: 1_000_000,
      guestCount: 100,
      occasion: 'wedding',
      priorities: ['food', 'photography'],
    });

    // 90% budget cut: new budget is only 100,000 INR
    const { plan: newPlan, differences } = recalculate(initialPlan, {
      totalBudget: 100_000,
    });

    expect(newPlan.totalBudget).toBe(100_000);

    const minFloor = 100_000 * 0.03; // 3,000 INR (3% minimum floor)

    // Verify EVERY single category is >= 3,000 INR and strictly positive
    for (const cat of ALL_CATEGORIES) {
      expect(newPlan.allocations[cat].amount).toBeGreaterThanOrEqual(minFloor);
      expect(newPlan.allocations[cat].amount).toBeGreaterThan(0);
    }

    // Sum of all categories must equal exactly the 100,000 INR budget
    const totalAllocated = ALL_CATEGORIES.reduce(
      (sum, cat) => sum + newPlan.allocations[cat].amount,
      0
    );
    expect(totalAllocated).toBe(100_000);

    // High priority categories retain more than the bare floor
    expect(newPlan.allocations.catering.amount).toBeGreaterThan(minFloor);
    expect(newPlan.allocations.photography.amount).toBeGreaterThan(minFloor);

    // Differences list must clearly document the massive cuts
    expect(differences.length).toBeGreaterThan(0);
    for (const diff of differences) {
      expect(diff.reason).toMatch(/budget cut|reduced/i);
    }
  });

  // Test 6: Input validations (budget <= 0, guestCount < 1, unknown priorities)
  it('throws clear errors for guest count < 1, budget <= 0, and unknown priorities', () => {
    // Budget <= 0
    expect(() =>
      createBudgetPlan({
        totalBudget: 0,
        guestCount: 50,
        occasion: 'party',
      })
    ).toThrow(/Total budget must be greater than zero/i);

    expect(() =>
      createBudgetPlan({
        totalBudget: -500,
        guestCount: 50,
        occasion: 'party',
      })
    ).toThrow(/Total budget must be greater than zero/i);

    // Guest count < 1
    expect(() =>
      createBudgetPlan({
        totalBudget: 500_000,
        guestCount: 0,
        occasion: 'party',
      })
    ).toThrow(/Guest count must be at least 1/i);

    expect(() =>
      createBudgetPlan({
        totalBudget: 500_000,
        guestCount: -5,
        occasion: 'party',
      })
    ).toThrow(/Guest count must be at least 1/i);

    // Unknown priority
    expect(() =>
      createBudgetPlan({
        totalBudget: 500_000,
        guestCount: 50,
        occasion: 'party',
        priorities: ['skydiving'],
      })
    ).toThrow(/Unknown priority: "skydiving"/i);

    // Validation in recalculate
    const validPlan = createBudgetPlan({
      totalBudget: 500_000,
      guestCount: 50,
      occasion: 'party',
    });

    expect(() => recalculate(validPlan, { totalBudget: 0 })).toThrow(
      /New total budget must be greater than zero/i
    );
    expect(() => recalculate(validPlan, { guestCount: -1 })).toThrow(
      /New guest count must be at least 1/i
    );
    expect(() =>
      recalculate(validPlan, { priorities: ['magician'] })
    ).toThrow(/Unknown priority: "magician"/i);
  });

  // Test 7: Budget too small warning
  it('returns a clear warning when budget is too small to satisfy all minimum floors realistically', () => {
    // Total budget of 100 INR with 50 guests
    const plan = createBudgetPlan({
      totalBudget: 100,
      guestCount: 50,
      occasion: 'party',
    });

    expect(plan.warnings).toBeDefined();
    expect(plan.warnings!.length).toBeGreaterThan(0);
    expect(plan.warnings![0]).toMatch(/too small to satisfy minimum category floors/i);
  });

  // Test 8: Budget increase surplus
  it('records a surplus entry with suggested use when budget is increased', () => {
    const initialPlan = createBudgetPlan({
      totalBudget: 1_000_000,
      guestCount: 100,
      occasion: 'wedding',
    });

    // Increase budget to 1,200,000 INR (+200,000 INR)
    const { plan: newPlan, differences } = recalculate(initialPlan, {
      totalBudget: 1_200_000,
    });

    expect(newPlan.totalBudget).toBe(1_200_000);
    expect(newPlan.surplus).toBe(200_000);

    const surplusDiff = differences.find((d) => d.category === 'surplus');
    expect(surplusDiff).toBeDefined();
    expect(surplusDiff?.newAmount).toBe(200_000);
    expect(surplusDiff?.suggestedUse).toBeDefined();
  });
});
