export const PRIORITY_OPTIONS = [
  { value: 'food', label: 'Food / Catering' },
  { value: 'decor', label: 'Decor' },
  { value: 'photography', label: 'Photography' },
  { value: 'venue', label: 'Venue' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'misc', label: 'Miscellaneous' },
];

export const OCCASIONS = [
  'wedding',
  'birthday',
  'anniversary',
  'community',
  'corporate',
  'other',
] as const;

export type OccasionType = typeof OCCASIONS[number];
