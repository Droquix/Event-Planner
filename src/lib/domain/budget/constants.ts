/**
 * Mathematical limits, distribution baselines, and category aliases for budget calculations.
 */
import type { BudgetCategory } from './types';

export const MIN_CATEGORY_FLOOR_RATE = 0.03;
export const MIN_CATEGORY_FLOOR_INR = 50;
export const MIN_CATERING_COST_PER_GUEST = 500;

export const ALL_CATEGORIES: readonly BudgetCategory[] = [
  'venue',
  'catering',
  'decor',
  'photography',
  'entertainment',
  'misc',
] as const;

export const BASELINE_WEIGHTS: Readonly<Record<BudgetCategory, number>> = {
  venue: 0.25,
  catering: 0.3,
  decor: 0.15,
  photography: 0.12,
  entertainment: 0.1,
  misc: 0.08,
} as const;

export const CATEGORY_ALIASES: Readonly<Record<string, BudgetCategory>> = {
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
} as const;
