/**
 * Timeline and task scheduling logic for event management.
 * Handles deadline calculation, topological sorting, circular dependency detection,
 * cascading risk propagation for cancelled tasks, and feasibility checks for overdue tasks.
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

// Default wedding task template with realistic dependencies
export const WEDDING_TASK_TEMPLATE: TaskTemplate[] = [
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
];

/**
 * Parses a date or YYYY-MM-DD string into UTC epoch milliseconds at midnight.
 */
function parseDateToUtcMs(inputDate: string | Date): number {
  if (typeof inputDate === 'string') {
    const parts = inputDate.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      return Date.UTC(parts[0], parts[1] - 1, parts[2]);
    }
  }
  const d = new Date(inputDate);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date provided: "${String(inputDate)}"`);
  }
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Calculates a deadline date backwards from an event date by a given number of days.
 * Operates in UTC to prevent timezone and daylight saving drift.
 */
export function calculateDeadline(
  eventDate: string | Date,
  daysBeforeEvent: number
): string {
  const baseMs = parseDateToUtcMs(eventDate);
  const targetDate = new Date(baseMs);
  targetDate.setUTCDate(targetDate.getUTCDate() - daysBeforeEvent);
  return targetDate.toISOString().split('T')[0];
}

/**
 * Detects circular dependencies within a task list.
 * Throws a detailed error describing the cycle if one exists.
 */
function findCycle(tasks: Task[]): string[] | null {
  const taskMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(currentId: string): string[] | null {
    visited.add(currentId);
    recursionStack.add(currentId);
    path.push(currentId);

    const task = taskMap.get(currentId);
    if (task) {
      for (const depId of task.dependsOn) {
        if (!taskMap.has(depId)) {
          continue;
        }
        if (!visited.has(depId)) {
          const cycle = dfs(depId);
          if (cycle) return cycle;
        } else if (recursionStack.has(depId)) {
          const cycleStartIndex = path.indexOf(depId);
          return [...path.slice(cycleStartIndex), depId];
        }
      }
    }

    recursionStack.delete(currentId);
    path.pop();
    return null;
  }

  for (const task of tasks) {
    if (!visited.has(task.id)) {
      const cycle = dfs(task.id);
      if (cycle) return cycle;
    }
  }

  return null;
}

/**
 * Sorts tasks so that all prerequisite dependencies come before dependent tasks (topological sort).
 * Detects circular dependencies and throws a clear error.
 */
export function sortTasksTopologically(tasks: Task[]): Task[] {
  // Step 1: Detect circular dependencies
  const cycle = findCycle(tasks);
  if (cycle) {
    throw new Error(
      `Circular dependency detected: ${cycle.join(' -> ')}`
    );
  }

  // Step 2: Kahn's algorithm for topological sorting
  const taskMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const task of tasks) {
    inDegree.set(task.id, 0);
    dependents.set(task.id, []);
  }

  for (const task of tasks) {
    for (const depId of task.dependsOn) {
      if (taskMap.has(depId)) {
        inDegree.set(task.id, (inDegree.get(task.id) ?? 0) + 1);
        dependents.get(depId)!.push(task.id);
      }
    }
  }

  // Priority queue / list of tasks with 0 pending dependencies.
  // We break ties by daysBeforeEvent descending (earlier preparation first).
  const queue: Task[] = tasks
    .filter((t) => (inDegree.get(t.id) ?? 0) === 0)
    .sort((a, b) => b.daysBeforeEvent - a.daysBeforeEvent);

  const sorted: Task[] = [];

  while (queue.length > 0) {
    queue.sort((a, b) => b.daysBeforeEvent - a.daysBeforeEvent);
    const current = queue.shift()!;
    sorted.push(current);

    for (const dependentId of dependents.get(current.id) ?? []) {
      const remaining = (inDegree.get(dependentId) ?? 1) - 1;
      inDegree.set(dependentId, remaining);
      if (remaining === 0) {
        queue.push(taskMap.get(dependentId)!);
      }
    }
  }

  if (sorted.length !== tasks.length) {
    throw new Error(
      'Circular dependency detected: Not all tasks could be resolved.'
    );
  }

  return sorted;
}

/**
 * Builds a wedding task list from a template, calculates deadlines backwards
 * from the event date, and sorts tasks topologically so dependencies come first.
 * If todayDate is provided, automatically evaluates feasibility against that date.
 */
export function buildWeddingTimeline(
  eventDate: string | Date,
  customTemplate: TaskTemplate[] = WEDDING_TASK_TEMPLATE,
  todayDate?: string | Date
): Task[] {
  // Step 1: Assign calculated deadlines and default status
  const tasksWithDeadlines: Task[] = customTemplate.map((t) => ({
    ...t,
    status: t.status ?? 'pending',
    deadline: calculateDeadline(eventDate, t.daysBeforeEvent),
  }));

  // Step 2: Topologically sort tasks so dependencies precede dependent tasks
  const sortedTasks = sortTasksTopologically(tasksWithDeadlines);

  // Step 3: If todayDate is provided, apply feasibility check
  if (todayDate !== undefined) {
    const feasibility = checkTimelineFeasibility(sortedTasks, todayDate);
    return feasibility.tasks;
  }

  return sortedTasks;
}

/**
 * Finds all task IDs that transitively depend on a given task ID.
 */
export function findDependentTaskIds(tasks: Task[], rootTaskId: string): Set<string> {
  const childrenMap = new Map<string, string[]>();
  for (const t of tasks) {
    for (const depId of t.dependsOn) {
      if (!childrenMap.has(depId)) {
        childrenMap.set(depId, []);
      }
      childrenMap.get(depId)!.push(t.id);
    }
  }

  const result = new Set<string>();
  const queue = [...(childrenMap.get(rootTaskId) ?? [])];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (!result.has(currentId)) {
      result.add(currentId);
      const nextChildren = childrenMap.get(currentId) ?? [];
      for (const childId of nextChildren) {
        if (!result.has(childId)) {
          queue.push(childId);
        }
      }
    }
  }

  return result;
}

/**
 * Checks timeline feasibility against a reference date (defaulting to today).
 * Tasks with deadlines before today are marked "overdue" and generate warning suggestions.
 * Tasks that depend on an overdue task are marked "at_risk".
 */
export function checkTimelineFeasibility(
  tasks: Task[],
  todayDate: string | Date = new Date()
): FeasibilityCheckResult {
  const todayMs = parseDateToUtcMs(todayDate);
  const overdueTaskIds = new Set<string>();
  const warnings: string[] = [];

  // Step 1: Identify overdue tasks whose deadline has already passed
  const updatedTasks: Task[] = tasks.map((task) => {
    if (!task.deadline) {
      return { ...task };
    }

    const deadlineMs = parseDateToUtcMs(task.deadline);
    if (deadlineMs < todayMs) {
      const daysOverdue = Math.max(
        1,
        Math.round((todayMs - deadlineMs) / (1000 * 60 * 60 * 24))
      );
      overdueTaskIds.add(task.id);

      const warningMessage = `${task.name} is ${daysOverdue} ${
        daysOverdue === 1 ? 'day' : 'days'
      } overdue. Suggest: book immediately or choose a faster option.`;

      warnings.push(warningMessage);

      return {
        ...task,
        status: 'overdue' as TaskStatus,
      };
    }

    return { ...task };
  });

  // Step 2: Find all downstream tasks that depend on any overdue task
  const dependentAtRiskIds = new Set<string>();
  for (const overdueId of overdueTaskIds) {
    const downstreamIds = findDependentTaskIds(updatedTasks, overdueId);
    for (const id of downstreamIds) {
      dependentAtRiskIds.add(id);
    }
  }

  // Step 3: Mark dependent tasks as "at_risk" unless they are already "overdue" or "cancelled"
  const finalTasks: Task[] = updatedTasks.map((task) => {
    if (
      dependentAtRiskIds.has(task.id) &&
      task.status !== 'overdue' &&
      task.status !== 'cancelled'
    ) {
      return {
        ...task,
        status: 'at_risk' as TaskStatus,
      };
    }
    return task;
  });

  return {
    tasks: finalTasks,
    warnings,
    isFeasible: overdueTaskIds.size === 0,
  };
}

/**
 * Builds wedding timeline and performs complete feasibility check in one call.
 */
export function buildWeddingTimelineWithFeasibility(
  eventDate: string | Date,
  customTemplate: TaskTemplate[] = WEDDING_TASK_TEMPLATE,
  todayDate: string | Date = new Date()
): FeasibilityCheckResult {
  const tasksWithDeadlines: Task[] = customTemplate.map((t) => ({
    ...t,
    status: t.status ?? 'pending',
    deadline: calculateDeadline(eventDate, t.daysBeforeEvent),
  }));

  const sortedTasks = sortTasksTopologically(tasksWithDeadlines);
  return checkTimelineFeasibility(sortedTasks, todayDate);
}

/**
 * Cancels a vendor task and marks all downstream dependent tasks as "at risk".
 * Pure function: returns a new task array without mutating the original input.
 * Supports flexible argument signature: cancelVendorTask(tasks, taskId) or cancelVendorTask(taskId, tasks).
 */
export function cancelVendorTask(
  tasksOrTaskId: Task[] | string,
  taskIdOrTasks: string | Task[]
): Task[] {
  let tasks: Task[];
  let targetTaskId: string;

  if (Array.isArray(tasksOrTaskId)) {
    tasks = tasksOrTaskId;
    targetTaskId = taskIdOrTasks as string;
  } else {
    targetTaskId = tasksOrTaskId;
    tasks = taskIdOrTasks as Task[];
  }

  const targetTask = tasks.find((t) => t.id === targetTaskId);
  if (!targetTask) {
    throw new Error(`Task with id "${targetTaskId}" was not found.`);
  }

  const affectedTaskIds = findDependentTaskIds(tasks, targetTaskId);

  return tasks.map((task) => {
    if (task.id === targetTaskId) {
      return { ...task, status: 'cancelled' };
    }
    if (affectedTaskIds.has(task.id)) {
      return { ...task, status: 'at_risk' };
    }
    return { ...task };
  });
}
