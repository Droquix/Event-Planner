import { describe, it, expect } from 'vitest';
import { EMPTY_SETUP } from '../src/types/plan';
import { createBudgetPlan } from '../src/lib/budget';

describe('Plan Reset & Fresh Reload (Phase 2)', () => {
  it('initializes with completely empty setup on load', () => {
    expect(EMPTY_SETUP.occasion).toBe('');
    expect(EMPTY_SETUP.date).toBe('');
    expect(EMPTY_SETUP.budget).toBe('');
    expect(EMPTY_SETUP.guestCount).toBe('');
    expect(EMPTY_SETUP.city).toBe('');
    expect(EMPTY_SETUP.priorities).toEqual([]);
  });

  it('rejects budget creation when setup fields are reset/empty', () => {
    expect(() =>
      createBudgetPlan({
        totalBudget: Number(EMPTY_SETUP.budget),
        guestCount: Number(EMPTY_SETUP.guestCount),
        occasion: EMPTY_SETUP.occasion,
        priorities: EMPTY_SETUP.priorities,
      })
    ).toThrow();
  });

  it('allows complete state wipe when resetting from active plan', () => {
    let currentPlan = {
      occasion: 'wedding',
      date: '2027-02-15',
      budget: '2500000',
      guestCount: '200',
      city: 'Mumbai',
      priorities: ['food', 'photography'],
    };

    // User triggers "Start new plan"
    currentPlan = { ...EMPTY_SETUP };

    expect(currentPlan.occasion).toBe('');
    expect(currentPlan.date).toBe('');
    expect(currentPlan.budget).toBe('');
    expect(currentPlan.guestCount).toBe('');
    expect(currentPlan.city).toBe('');
    expect(currentPlan.priorities).toHaveLength(0);
  });
});
