/**
 * Shared types and state initialization for Event Planner.
 */

export type TabId = 'onboarding' | 'budget' | 'timeline' | 'vendors';

export interface EventSetup {
  occasion: string;
  date: string;
  budget: string;
  guestCount: string;
  city: string;
  priorities: string[];
}

export const EMPTY_SETUP: EventSetup = {
  occasion: '',
  date: '',
  budget: '',
  guestCount: '',
  city: '',
  priorities: [],
};
