/**
 * DAG graph utilities: cycle detection, topological sorting, and transitive dependent discovery.
 */
import type { Task } from './types';

/**
 * Detects circular dependencies within a task list using DFS.
 */
export function findCycle(tasks: Task[]): string[] | null {
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
        if (!taskMap.has(depId)) continue;
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
 */
export function sortTasksTopologically(tasks: Task[]): Task[] {
  const cycle = findCycle(tasks);
  if (cycle) {
    throw new Error(`Circular dependency detected: ${cycle.join(' -> ')}`);
  }

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
    throw new Error('Circular dependency detected: Not all tasks could be resolved.');
  }

  return sorted;
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
