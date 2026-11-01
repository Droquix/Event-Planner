/**
 * Standard milestone templates for event planning with realistic dependencies.
 */
import type { TaskTemplate } from './types';

export const WEDDING_TASK_TEMPLATE: readonly TaskTemplate[] = [
  {
    id: 'book-venue',
    name: 'Book Wedding Venue',
    daysBeforeEvent: 180,
    dependsOn: [],
  },
  {
    id: 'hire-caterer',
    name: 'Hire Caterer',
    daysBeforeEvent: 120,
    dependsOn: ['book-venue'],
  },
  {
    id: 'hire-photographer',
    name: 'Hire Photographer & Videographer',
    daysBeforeEvent: 120,
    dependsOn: ['book-venue'],
  },
  {
    id: 'send-invitations',
    name: 'Send Invitations',
    daysBeforeEvent: 90,
    dependsOn: ['book-venue'],
  },
  {
    id: 'hire-decorator',
    name: 'Hire Decorator & Florist',
    daysBeforeEvent: 75,
    dependsOn: ['book-venue'],
  },
  {
    id: 'finalize-guest-count',
    name: 'Finalize RSVP Guest Count',
    daysBeforeEvent: 30,
    dependsOn: ['send-invitations'],
  },
  {
    id: 'finalize-catering-menu',
    name: 'Finalize Food Menu & Tasting',
    daysBeforeEvent: 20,
    dependsOn: ['hire-caterer', 'finalize-guest-count'],
  },
  {
    id: 'decor-installation-plan',
    name: 'Approve Decor Layout & Floral Plan',
    daysBeforeEvent: 14,
    dependsOn: ['hire-decorator'],
  },
  {
    id: 'rehearsal-walkthrough',
    name: 'Conduct Venue & Sound Rehearsal',
    daysBeforeEvent: 2,
    dependsOn: ['book-venue', 'decor-installation-plan'],
  },
] as const;
