/**
 * Pure scheduling logic, deadline resolution, feasibility calculation, and risk cascades.
 */
import { WEDDING_TASK_TEMPLATE } from './templates';
import { findDependentTaskIds, sortTasksTopologically } from './graph';
import type { FeasibilityCheckResult, Task, TaskStatus, TaskTemplate } from './types';

export { findCycle, sortTasksTopologically, findDependentTaskIds } from './graph';

/**
 * Parses a date or YYYY-MM-DD string into UTC epoch milliseconds at midnight.
 */
export function parseDateToUtcMs(inputDate: string | Date): number {
  if (typeof inputDate === 'string') {
    const parts = inputDate.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const year = parts[0];
      const month = parts[1] - 1;
      const day = parts[2];
      const d = new Date(Date.UTC(year, month, day));
      if (d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day) {
        return d.getTime();
      }
      throw new Error(`Invalid date provided: "${String(inputDate)}"`);
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
 */
export function calculateDeadline(eventDate: string | Date, daysBeforeEvent: number): string {
  const baseMs = parseDateToUtcMs(eventDate);
  const targetDate = new Date(baseMs);
  targetDate.setUTCDate(targetDate.getUTCDate() - daysBeforeEvent);
  return targetDate.toISOString().split('T')[0];
}

/**
 * Checks timeline feasibility against a reference date (defaulting to today).
 */
export function checkTimelineFeasibility(
  tasks: Task[],
  todayDate: string | Date = new Date()
): FeasibilityCheckResult {
  const todayMs = parseDateToUtcMs(todayDate);
  const overdueTaskIds = new Set<string>();
  const warnings: string[] = [];

  const updatedTasks: Task[] = tasks.map((task) => {
    if (!task.deadline) return { ...task };
    const deadlineMs = parseDateToUtcMs(task.deadline);
    if (deadlineMs < todayMs) {
      const daysOverdue = Math.max(1, Math.round((todayMs - deadlineMs) / (1000 * 60 * 60 * 24)));
      overdueTaskIds.add(task.id);
      warnings.push(
        `${task.name} is ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue. Suggest: book immediately or choose a faster option.`
      );
      return { ...task, status: 'overdue' as TaskStatus };
    }
    return { ...task };
  });

  const dependentAtRiskIds = new Set<string>();
  for (const overdueId of overdueTaskIds) {
    const downstreamIds = findDependentTaskIds(updatedTasks, overdueId);
    for (const id of downstreamIds) dependentAtRiskIds.add(id);
  }

  const finalTasks: Task[] = updatedTasks.map((task) => {
    if (
      dependentAtRiskIds.has(task.id) &&
      task.status !== 'overdue' &&
      task.status !== 'cancelled'
    ) {
      return { ...task, status: 'at_risk' as TaskStatus };
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
 * Builds a wedding task list from a template and calculates deadlines backwards.
 */
export function buildWeddingTimeline(
  eventDate: string | Date,
  customTemplate: readonly TaskTemplate[] = WEDDING_TASK_TEMPLATE,
  todayDate?: string | Date
): Task[] {
  const tasksWithDeadlines: Task[] = customTemplate.map((t) => ({
    ...t,
    status: t.status ?? 'pending',
    deadline: calculateDeadline(eventDate, t.daysBeforeEvent),
  }));

  const sortedTasks = sortTasksTopologically(tasksWithDeadlines);

  if (todayDate !== undefined) {
    const feasibility = checkTimelineFeasibility(sortedTasks, todayDate);
    return feasibility.tasks;
  }

  return sortedTasks;
}

/**
 * Builds wedding timeline and performs complete feasibility check in one call.
 */
export function buildWeddingTimelineWithFeasibility(
  eventDate: string | Date,
  customTemplate: readonly TaskTemplate[] = WEDDING_TASK_TEMPLATE,
  todayDate: string | Date = new Date()
): FeasibilityCheckResult {
  const eventMs = parseDateToUtcMs(eventDate);
  const todayMs = parseDateToUtcMs(todayDate);

  const check = checkTimelineFeasibility(buildWeddingTimeline(eventDate, customTemplate), todayDate);

  if (eventMs < todayMs) {
    const formatted =
      typeof eventDate === 'string' ? eventDate : eventDate.toISOString().split('T')[0];
    check.warnings.unshift(
      `Event date (${formatted}) is in the past. All milestone lead times are elapsed.`
    );
    check.isFeasible = false;
  }

  return check;
}

/**
 * Cancels a vendor task and marks all downstream dependent tasks as "at risk".
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
