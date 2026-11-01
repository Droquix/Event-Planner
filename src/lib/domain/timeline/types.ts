/**
 * Pure domain types for event milestones, dependency graphs, and status values.
 */

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'at_risk'
  | 'cancelled'
  | 'overdue';

export interface Task {
  id: string;
  name: string;
  daysBeforeEvent: number; // Lead time: days before event when task should finish
  dependsOn: string[]; // List of task IDs that must finish before this task
  deadline?: string; // Calculated deadline formatted as YYYY-MM-DD
  status?: TaskStatus; // Current task status
}

export type TaskTemplate = Omit<Task, 'deadline' | 'status'> & {
  status?: TaskStatus;
};

export interface FeasibilityCheckResult {
  tasks: Task[];
  warnings: string[];
  isFeasible: boolean;
}
