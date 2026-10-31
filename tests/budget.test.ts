import { describe, it, expect } from 'vitest';
import {
  createBudgetPlan,
  recalculate,
  ALL_CATEGORIES,
  MIN_CATEGORY_FLOOR_RATE,
  MIN_CATERING_COST_PER_GUEST,
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

  // ─── Test 9: Catering-per-guest minimum warning ────────────────────────────

  it('warns when catering cost per guest falls below the configured minimum on plan creation', () => {
    // At ₹50,000 total with 500 guests, catering gets ~30% = ₹15,000 → ₹30/guest,
    // which is well below MIN_CATERING_COST_PER_GUEST (₹500).
    const plan = createBudgetPlan({
      totalBudget: 50_000,
      guestCount: 500,
      occasion: 'party',
    });

    expect(plan.warnings).toBeDefined();
    const cateringWarn = plan.warnings!.find((w) =>
      w.includes('below the recommended minimum')
    );
    expect(cateringWarn).toBeDefined();
    expect(cateringWarn).toContain(`₹${MIN_CATERING_COST_PER_GUEST.toLocaleString('en-IN')} per guest`);
  });

  it('warns when catering cost per guest falls below the configured minimum after recalculation', () => {
    // Start with a healthy plan
    const initialPlan = createBudgetPlan({
      totalBudget: 1_000_000,
      guestCount: 50,
      occasion: 'wedding',
    });

    // Balloon the guest count so that the fixed catering envelope becomes tiny per head
    const { plan: newPlan, warnings } = recalculate(initialPlan, {
      guestCount: 5000,
    });

    // Per-guest catering: budget stays same so 30% of ₹10,00,000 = ₹3,00,000 / 5000 = ₹60 — well below ₹500
    const perGuest = newPlan.allocations.catering.amount / newPlan.guestCount;
    expect(perGuest).toBeLessThan(MIN_CATERING_COST_PER_GUEST);

    const warnList = warnings ?? newPlan.warnings ?? [];
    const cateringWarn = warnList.find((w) => w.includes('below the recommended minimum'));
    expect(cateringWarn).toBeDefined();
    expect(cateringWarn).toContain(`₹${MIN_CATERING_COST_PER_GUEST.toLocaleString('en-IN')} per guest`);
  });

  it('does NOT warn about catering per guest when the budget is healthy', () => {
    // ₹10,00,000 with 100 guests: catering ~₹3,00,000 → ₹3,000/guest, well above ₹500
    const plan = createBudgetPlan({
      totalBudget: 1_000_000,
      guestCount: 100,
      occasion: 'wedding',
    });

    const cateringWarn = (plan.warnings ?? []).find((w) =>
      w.includes('below the recommended minimum')
    );
    expect(cateringWarn).toBeUndefined();
  });

  // ─── Test 10: Property-based budget conservation (30 random combinations) ──

  it('invariant: sum(category amounts) + surplus === totalBudget (±1 rupee rounding) across 30 random inputs', () => {
    // Deterministic pseudo-random number generator seeded at construction time
    // so test results are reproducible across runs.
    // LCG parameters from Numerical Recipes (good distribution for small ranges)
    function makeLcg(seed: number) {
      let s = seed >>> 0;
      return function nextInt(min: number, max: number): number {
        s = Math.imul(1664525, s) + 1013904223;
        // Use unsigned right-shift to keep positive
        const r = (s >>> 0) / 0xffffffff;
        return Math.floor(r * (max - min + 1)) + min;
      };
    }

    const rand = makeLcg(42);

    const PRIORITY_POOL = ['food', 'photography', 'decor', 'venue', 'entertainment', 'misc'];

    type TestCase = { budget: number; guests: number; changeBudget?: number; changeGuests?: number };

    // Build 30 varied test cases
    const cases: TestCase[] = [
      // Tiny budgets
      { budget: 10_000,    guests: 10   },
      { budget: 50_000,    guests: 20   },
      // Mid-range
      { budget: 500_000,   guests: 100  },
      { budget: 750_000,   guests: 200  },
      { budget: 1_000_000, guests: 150  },
      // Large
      { budget: 5_000_000, guests: 500  },
      { budget: 10_000_000,guests: 1000 },
      // Guest increase
      { budget: 1_000_000, guests: 100, changeGuests: 180 },
      { budget: 800_000,   guests: 80,  changeGuests: 300 },
      // Guest decrease (generates surplus)
      { budget: 1_000_000, guests: 200, changeGuests: 50  },
      { budget: 500_000,   guests: 100, changeGuests: 10  },
      // Budget cuts (moderate)
      { budget: 1_000_000, guests: 100, changeBudget: 700_000 },
      { budget: 800_000,   guests: 100, changeBudget: 600_000 },
      // Budget cuts (severe)
      { budget: 1_000_000, guests: 100, changeBudget: 100_000 },
      { budget: 2_000_000, guests: 200, changeBudget: 50_000  },
      // Budget increase (generates surplus)
      { budget: 500_000,   guests: 50,  changeBudget: 800_000 },
      { budget: 300_000,   guests: 30,  changeBudget: 1_200_000 },
      // Simultaneous guest + budget change
      { budget: 1_000_000, guests: 100, changeBudget: 700_000, changeGuests: 130 },
      { budget: 500_000,   guests: 50,  changeBudget: 300_000, changeGuests: 80  },
      { budget: 2_000_000, guests: 400, changeBudget: 1_800_000, changeGuests: 350 },
      // Fully random combinations (filled to reach 30 total)
      ...Array.from({ length: 10 }, () => {
        const budget      = rand(50_000, 5_000_000);
        const guests      = rand(10, 500);
        const changeKind  = rand(0, 2); // 0=none, 1=budget, 2=guests
        return {
          budget,
          guests,
          changeBudget:  changeKind === 1 ? rand(10_000, budget) : undefined,
          changeGuests:  changeKind === 2 ? rand(1, guests + 100) : undefined,
        };
      }),
    ];

    // Verify exactly 30 cases
    expect(cases.length).toBe(30);

    cases.forEach(({ budget, guests, changeBudget, changeGuests }, idx) => {
      // Step 1: create the initial plan
      const plan = createBudgetPlan({
        totalBudget: budget,
        guestCount: guests,
        occasion: 'test',
        // Pick 0–2 random priorities from the pool for variety
        priorities: PRIORITY_POOL.slice(0, rand(0, 2)),
      });

      // Helper that checks the invariant for a given plan
      function assertConservation(p: BudgetPlan, label: string) {
        const categorySum = ALL_CATEGORIES.reduce(
          (sum, cat) => sum + p.allocations[cat].amount,
          0
        );
        const total = categorySum + (p.surplus ?? 0);
        // Allow at most 1 rupee rounding difference
        const diff = Math.abs(total - p.totalBudget);
        expect(diff, `[case ${idx + 1}] ${label}: |sum+surplus - budget| = ${diff} > 1`).toBeLessThanOrEqual(1);
      }

      // Check invariant on the freshly-created plan
      assertConservation(plan, 'createBudgetPlan');

      // Step 2: if a change is specified, recalculate and check invariant again
      if (changeBudget !== undefined || changeGuests !== undefined) {
        const changes: Record<string, number> = {};
        if (changeBudget !== undefined) changes.totalBudget = changeBudget;
        if (changeGuests !== undefined) changes.guestCount  = changeGuests;

        const { plan: newPlan } = recalculate(plan, changes);
        assertConservation(newPlan, 'recalculate');
      }
    });
  });
});
