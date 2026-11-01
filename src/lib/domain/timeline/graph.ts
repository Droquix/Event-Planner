/**
 * DAG graph utilities: cycle detection, topological sorting, and transitive dependent discovery.
 */
import type { Task } from './types';

interface CycleContext {
  taskMap: Map<string, Task>;
  visited: Set<string>;
  recursionStack: Set<string>;
  path: string[];
}

/**
 * Depth-first search step to detect a cycle from a single node.
 */
function dfsCycle(currentId: string, ctx: CycleContext): string[] | null {
  ctx.visited.add(currentId);
  ctx.recursionStack.add(currentId);
  ctx.path.push(currentId);

  const task = ctx.taskMap.get(currentId);
  const deps = task?.dependsOn ?? [];

  for (const depId of deps) {
    if (!ctx.taskMap.has(depId)) continue;
    if (!ctx.visited.has(depId)) {
      const cycle = dfsCycle(depId, ctx);
      if (cycle) return cycle;
    } else if (ctx.recursionStack.has(depId)) {
      const cycleStartIndex = ctx.path.indexOf(depId);
      return [...ctx.path.slice(cycleStartIndex), depId];
    }
  }

  ctx.recursionStack.delete(currentId);
  ctx.path.pop();
  return null;
}

/**
 * Detects circular dependencies within a task list using DFS.
 */
export function findCycle(tasks: Task[]): string[] | null {
  const ctx: CycleContext = {
    taskMap: new Map<string, Task>(tasks.map((t) => [t.id, t])),
    visited: new Set<string>(),
    recursionStack: new Set<string>(),
    path: [],
  };

  for (const task of tasks) {
    if (!ctx.visited.has(task.id)) {
      const cycle = dfsCycle(task.id, ctx);
      if (cycle) return cycle;
    }
  }

  return null;
}

function registerDependencies(
  task: Task,
  taskMap: Map<string, Task>,
  inDegree: Map<string, number>,
  dependents: Map<string, string[]>
) {
  for (const depId of task.dependsOn) {
    if (!taskMap.has(depId)) continue;
    inDegree.set(task.id, (inDegree.get(task.id) ?? 0) + 1);
    dependents.get(depId)?.push(task.id);
  }
}

/**
 * Builds in-degrees and dependent maps for Kahn's algorithm.
 */
function buildGraphStructures(tasks: Task[], taskMap: Map<string, Task>) {
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const task of tasks) {
    inDegree.set(task.id, 0);
    dependents.set(task.id, []);
  }

  for (const task of tasks) {
    registerDependencies(task, taskMap, inDegree, dependents);
  }

  return { inDegree, dependents };
}

interface KahnContext {
  queue: Task[];
  inDegree: Map<string, number>;
  dependents: Map<string, string[]>;
  taskMap: Map<string, Task>;
}

function decrementDependents(currentId: string, ctx: KahnContext) {
  for (const dependentId of ctx.dependents.get(currentId) ?? []) {
    const remaining = (ctx.inDegree.get(dependentId) ?? 1) - 1;
    ctx.inDegree.set(dependentId, remaining);
    if (remaining === 0) {
      const nextTask = ctx.taskMap.get(dependentId);
      if (nextTask) ctx.queue.push(nextTask);
    }
  }
}

function processKahnQueue(ctx: KahnContext): Task[] {
  const sorted: Task[] = [];
  while (ctx.queue.length > 0) {
    ctx.queue.sort((a, b) => b.daysBeforeEvent - a.daysBeforeEvent);
    const current = ctx.queue.shift();
    if (!current) break;
    sorted.push(current);
    decrementDependents(current.id, ctx);
  }
  return sorted;
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
  const { inDegree, dependents } = buildGraphStructures(tasks, taskMap);

  const initialQueue = tasks
    .filter((t) => (inDegree.get(t.id) ?? 0) === 0)
    .sort((a, b) => b.daysBeforeEvent - a.daysBeforeEvent);

  const sorted = processKahnQueue({ queue: initialQueue, inDegree, dependents, taskMap });

  if (sorted.length !== tasks.length) {
    throw new Error('Circular dependency detected: Not all tasks could be resolved.');
  }

  return sorted;
}

function buildChildrenMap(tasks: Task[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const t of tasks) {
    for (const depId of t.dependsOn) {
      const list = map.get(depId) ?? [];
      list.push(t.id);
      map.set(depId, list);
    }
  }
  return map;
}

/**
 * Finds all task IDs that transitively depend on a given task ID.
 */
export function findDependentTaskIds(tasks: Task[], rootTaskId: string): Set<string> {
  const childrenMap = buildChildrenMap(tasks);
  const result = new Set<string>();
  const queue = [...(childrenMap.get(rootTaskId) ?? [])];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || result.has(currentId)) continue;

    result.add(currentId);
    for (const childId of childrenMap.get(currentId) ?? []) {
      if (!result.has(childId)) {
        queue.push(childId);
      }
    }
  }

  return result;
}
