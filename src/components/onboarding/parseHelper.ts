import type { EventSetup } from '../../types/plan';

function parseBudget(val: unknown, fallback: string): string {
  const num = Number(val);
  return val !== undefined && val !== null && !isNaN(num) && num > 0 ? String(val) : fallback;
}

function parseGuests(val: unknown, fallback: string): string {
  const num = Number(val);
  return val !== undefined && val !== null && !isNaN(num) && num >= 1 ? String(val) : fallback;
}

function parseTrimmed(val: unknown, fallback: string, lowercase = false): string {
  if (typeof val === 'string' && val.trim()) {
    const trimmed = val.trim();
    return lowercase ? trimmed.toLowerCase() : trimmed;
  }
  return fallback;
}

function parsePriorities(val: unknown, fallback: string[]): string[] {
  return Array.isArray(val) && val.length > 0 ? (val as string[]) : fallback;
}

export function mergeParsedData(
  current: EventSetup,
  data: Record<string, unknown>
): EventSetup {
  return {
    occasion: parseTrimmed(data.occasion, current.occasion, true),
    date: parseTrimmed(data.date, current.date),
    budget: parseBudget(data.budget, current.budget),
    guestCount: parseGuests(data.guestCount, current.guestCount),
    city: parseTrimmed(data.city, current.city),
    priorities: parsePriorities(data.priorities, current.priorities),
  };
}
