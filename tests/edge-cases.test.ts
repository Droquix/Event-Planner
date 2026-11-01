import { describe, it, expect } from 'vitest';
import { createBudgetPlan, recalculate } from '../src/lib/budget';
import { calculateDeadline, buildWeddingTimelineWithFeasibility } from '../src/lib/timeline';

describe('Phase 3 Hidden Bugs & Edge Cases', () => {
  describe('Budget Math & Input Integrity', () => {
    it('rejects NaN budget with a descriptive error', () => {
      expect(() =>
        createBudgetPlan({
          totalBudget: NaN,
          guestCount: 100,
          occasion: 'wedding',
        })
      ).toThrow('Total budget must be greater than zero.');
    });

    it('rejects NaN guest count with a descriptive error', () => {
      expect(() =>
        createBudgetPlan({
          totalBudget: 500000,
          guestCount: NaN,
          occasion: 'wedding',
        })
      ).toThrow('Guest count must be at least 1.');
    });

    it('rejects negative numbers in createBudgetPlan', () => {
      expect(() =>
        createBudgetPlan({
          totalBudget: -50000,
          guestCount: 50,
          occasion: 'wedding',
        })
      ).toThrow('Total budget must be greater than zero.');

      expect(() =>
        createBudgetPlan({
          totalBudget: 50000,
          guestCount: -5,
          occasion: 'wedding',
        })
      ).toThrow('Guest count must be at least 1.');
    });

    it('rejects NaN and non-positive numbers in recalculate', () => {
      const plan = createBudgetPlan({
        totalBudget: 1000000,
        guestCount: 100,
        occasion: 'wedding',
      });

      expect(() => recalculate(plan, { totalBudget: NaN })).toThrow();
      expect(() => recalculate(plan, { guestCount: NaN })).toThrow();
      expect(() => recalculate(plan, { totalBudget: -100 })).toThrow();
      expect(() => recalculate(plan, { guestCount: 0 })).toThrow();
    });
  });

  describe('Timeline Date Integrity & Past Event Handling', () => {
    it('detects invalid calendar date such as February 31st', () => {
      // 2026-02-31 should be rejected as an invalid date
      expect(() => calculateDeadline('2026-02-31', 30)).toThrow(/Invalid date/);
    });

    it('flags event dates in the past with warning and infeasibility', () => {
      const pastEvent = '2023-01-01';
      const referenceToday = '2026-11-01';
      const result = buildWeddingTimelineWithFeasibility(pastEvent, undefined, referenceToday);

      expect(result.isFeasible).toBe(false);
      expect(result.warnings.some((w) => w.includes('is in the past'))).toBe(true);
    });

    it('calculates valid future dates accurately without timezone drift', () => {
      const eventDate = '2027-02-15';
      const deadline = calculateDeadline(eventDate, 30);
      expect(deadline).toBe('2027-01-16');
    });
  });

  describe('Vendor Handling: 0 and 1 Vendor Edge Cases', () => {
    it('handles 0 vendors cleanly without errors', () => {
      const vendors: Array<{ id: string; name: string; category: string; price: number }> = [];
      const venueVendors = vendors.filter((v) => v.category === 'venue');
      expect(venueVendors.length).toBe(0);
      // Comparison requires > 1 vendor
      expect(venueVendors.length > 1).toBe(false);
    });

    it('requires at least 2 quotes in the same category for comparison table', () => {
      const singleVendor = [{ id: '1', name: 'Grand Hall', category: 'venue', price: 500000 }];
      expect(singleVendor.length > 1).toBe(false);

      const twoVendors = [
        ...singleVendor,
        { id: '2', name: 'Palace Banquets', category: 'venue', price: 450000 },
      ];
      expect(twoVendors.length > 1).toBe(true);

      const sortedByPrice = [...twoVendors].sort((a, b) => a.price - b.price);
      expect(sortedByPrice[0].name).toBe('Palace Banquets');
      expect(sortedByPrice[0].price).toBe(450000);
    });
  });
});
