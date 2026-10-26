import { describe, it, expect } from 'vitest';
import {
  calculateDeadline,
  sortTasksTopologically,
  buildWeddingTimeline,
  buildWeddingTimelineWithFeasibility,
  checkTimelineFeasibility,
  cancelVendorTask,
  type Task,
  type TaskTemplate,
} from '../src/lib/timeline';

describe('Timeline & Scheduling Logic', () => {
  // Test 1: Deadline calculation backwards from event date
  it('calculates deadlines correctly backwards from the event date', () => {
    // 2026-12-31 minus 10 days = 2026-12-21
    const deadline10 = calculateDeadline('2026-12-31', 10);
    expect(deadline10).toBe('2026-12-21');

    // 2026-12-31 minus 180 days = 2026-07-04
    const deadline180 = calculateDeadline('2026-12-31', 180);
    expect(deadline180).toBe('2026-07-04');

    // Invalid date input throws error
    expect(() => calculateDeadline('not-a-real-date', 10)).toThrow(
      /Invalid date provided/i
    );
  });

  // Test 2: Normal case for wedding timeline creation and topological ordering
  it('builds wedding timeline, assigns deadlines backwards, and orders tasks so dependencies come first', () => {
    const eventDate = '2026-12-31';
    const timeline = buildWeddingTimeline(eventDate);

    expect(timeline.length).toBeGreaterThan(0);

    // Verify all tasks have deadlines and default status
    for (const task of timeline) {
      expect(task.deadline).toBeDefined();
      expect(task.status).toBe('pending');
      expect(task.daysBeforeEvent).toBeGreaterThanOrEqual(0);
    }

    // Verify topological order: every prerequisite MUST appear BEFORE the task that depends on it
    const indexMap = new Map<string, number>();
    timeline.forEach((task, index) => {
      indexMap.set(task.id, index);
    });

    for (const task of timeline) {
      const taskIndex = indexMap.get(task.id)!;
      for (const prerequisiteId of task.dependsOn) {
        const prerequisiteIndex = indexMap.get(prerequisiteId);
        expect(prerequisiteIndex).toBeDefined();
        expect(prerequisiteIndex!).toBeLessThan(taskIndex);
      }
    }

    // Specifically verify known chain:
    // book-venue -> hire-caterer -> finalize-catering-menu
    const venueIdx = indexMap.get('book-venue')!;
    const catererIdx = indexMap.get('hire-caterer')!;
    const menuIdx = indexMap.get('finalize-catering-menu')!;

    expect(venueIdx).toBeLessThan(catererIdx);
    expect(catererIdx).toBeLessThan(menuIdx);
  });

  // Test 3: Circular dependency detection
  it('detects circular dependencies and throws a clear error', () => {
    // Direct cycle: A -> B -> A
    const circularTasksDirect: Task[] = [
      { id: 'task-a', name: 'Task A', daysBeforeEvent: 30, dependsOn: ['task-b'] },
      { id: 'task-b', name: 'Task B', daysBeforeEvent: 20, dependsOn: ['task-a'] },
    ];

    expect(() => sortTasksTopologically(circularTasksDirect)).toThrow(
      /Circular dependency detected/i
    );

    // Indirect 3-node cycle: A -> B -> C -> A
    const circularTasksIndirect: Task[] = [
      { id: 'task-1', name: 'Task 1', daysBeforeEvent: 50, dependsOn: ['task-3'] },
      { id: 'task-2', name: 'Task 2', daysBeforeEvent: 40, dependsOn: ['task-1'] },
      { id: 'task-3', name: 'Task 3', daysBeforeEvent: 30, dependsOn: ['task-2'] },
    ];

    expect(() => sortTasksTopologically(circularTasksIndirect)).toThrow(
      /Circular dependency detected/i
    );
  });

  // Test 4: Cancelled vendor marks dependent tasks as "at risk"
  it('cancels vendor task and marks direct and downstream dependent tasks as at risk', () => {
    const timeline = buildWeddingTimeline('2026-12-31');

    // Cancel 'hire-caterer'
    const updatedTimeline = cancelVendorTask(timeline, 'hire-caterer');

    // 1. Target task itself should be 'cancelled'
    const cancelledTask = updatedTimeline.find((t) => t.id === 'hire-caterer');
    expect(cancelledTask).toBeDefined();
    expect(cancelledTask?.status).toBe('cancelled');

    // 2. Downstream dependent task 'finalize-catering-menu' should be 'at_risk'
    const dependentTask = updatedTimeline.find(
      (t) => t.id === 'finalize-catering-menu'
    );
    expect(dependentTask).toBeDefined();
    expect(dependentTask?.status).toBe('at_risk');

    // 3. Unrelated tasks (like 'book-venue' or 'hire-photographer') remain 'pending'
    const venueTask = updatedTimeline.find((t) => t.id === 'book-venue');
    expect(venueTask?.status).toBe('pending');

    const photoTask = updatedTimeline.find((t) => t.id === 'hire-photographer');
    expect(photoTask?.status).toBe('pending');

    // 4. Purity check: input array is not mutated
    const originalCaterer = timeline.find((t) => t.id === 'hire-caterer');
    expect(originalCaterer?.status).toBe('pending');
  });

  // Test 5: Transitive risk propagation across multi-level dependencies
  it('propagates at_risk status transitively across multi-step chains', () => {
    const customTasks: TaskTemplate[] = [
      { id: 'venue', name: 'Venue', daysBeforeEvent: 100, dependsOn: [] },
      { id: 'decor', name: 'Decor', daysBeforeEvent: 80, dependsOn: ['venue'] },
      { id: 'flowers', name: 'Flowers', daysBeforeEvent: 40, dependsOn: ['decor'] },
      { id: 'walkthrough', name: 'Walkthrough', daysBeforeEvent: 10, dependsOn: ['flowers'] },
      { id: 'music', name: 'Music', daysBeforeEvent: 50, dependsOn: ['venue'] },
    ];

    const timeline = buildWeddingTimeline('2026-12-31', customTasks);

    // Cancel 'decor'
    const result = cancelVendorTask(timeline, 'decor');

    expect(result.find((t) => t.id === 'decor')?.status).toBe('cancelled');
    expect(result.find((t) => t.id === 'flowers')?.status).toBe('at_risk');
    expect(result.find((t) => t.id === 'walkthrough')?.status).toBe('at_risk');

    // Venue and Music should remain unaffected
    expect(result.find((t) => t.id === 'venue')?.status).toBe('pending');
    expect(result.find((t) => t.id === 'music')?.status).toBe('pending');
  });

  // Test 6: Feasibility check with overdue tasks and warnings
  it('performs feasibility check, marks past tasks as overdue with warnings, and marks dependents as at_risk', () => {
    const tasks: Task[] = [
      {
        id: 'venue',
        name: 'Venue booking',
        daysBeforeEvent: 60,
        dependsOn: [],
        deadline: '2026-10-20', // 6 days before 2026-10-26
        status: 'pending',
      },
      {
        id: 'catering',
        name: 'Catering tasting',
        daysBeforeEvent: 30,
        dependsOn: ['venue'],
        deadline: '2026-11-10', // in the future
        status: 'pending',
      },
      {
        id: 'invitations',
        name: 'Invitations',
        daysBeforeEvent: 20,
        dependsOn: [],
        deadline: '2026-11-20', // in the future, independent
        status: 'pending',
      },
    ];

    const today = '2026-10-26';
    const { tasks: updatedTasks, warnings, isFeasible } = checkTimelineFeasibility(
      tasks,
      today
    );

    expect(isFeasible).toBe(false);

    // Venue booking should be marked overdue
    const venue = updatedTasks.find((t) => t.id === 'venue');
    expect(venue?.status).toBe('overdue');

    // Catering tasting depends on overdue venue booking -> marked at_risk
    const catering = updatedTasks.find((t) => t.id === 'catering');
    expect(catering?.status).toBe('at_risk');

    // Invitations is independent and deadline is in the future -> remains pending
    const invitations = updatedTasks.find((t) => t.id === 'invitations');
    expect(invitations?.status).toBe('pending');

    // Warnings list includes overdue count and actionable suggestion
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('Venue booking is 6 days overdue');
    expect(warnings[0]).toContain('Suggest: book immediately or choose a faster option');
  });

  // Test 7: Event only 30 days away (tight schedule test)
  it('handles an event only 30 days away, correctly marking tasks overdue and at risk', () => {
    const today = '2026-10-26';
    const eventDate = '2026-11-25'; // Exactly 30 days from today

    const { tasks, warnings, isFeasible } = buildWeddingTimelineWithFeasibility(
      eventDate,
      undefined,
      today
    );

    expect(isFeasible).toBe(false);

    // In the wedding template, tasks with daysBeforeEvent > 30 should be overdue:
    // - book-venue (180 days before event -> deadline was 150 days ago)
    // - hire-caterer (120 days before event -> deadline was 90 days ago)
    // - hire-photographer (120 days before event -> deadline was 90 days ago)
    // - send-invitations (90 days before event -> deadline was 60 days ago)
    // - hire-decorator (75 days before event -> deadline was 45 days ago)
    const overdueTaskIds = [
      'book-venue',
      'hire-caterer',
      'hire-photographer',
      'send-invitations',
      'hire-decorator',
    ];

    for (const id of overdueTaskIds) {
      const task = tasks.find((t) => t.id === id);
      expect(task).toBeDefined();
      expect(task?.status).toBe('overdue');
    }

    // Warnings must be generated for all overdue tasks
    expect(warnings.length).toBeGreaterThanOrEqual(5);
    const venueWarning = warnings.find((w) => w.includes('Book Wedding Venue'));
    expect(venueWarning).toBeDefined();
    expect(venueWarning).toContain('150 days overdue');
    expect(venueWarning).toContain('Suggest: book immediately or choose a faster option');

    // Tasks that have lead time <= 30 days but depend on overdue tasks must be marked "at_risk"
    // e.g. finalize-catering-menu (20 days before event, deadline in 10 days) depends on hire-caterer
    const cateringMenuTask = tasks.find((t) => t.id === 'finalize-catering-menu');
    expect(cateringMenuTask).toBeDefined();
    expect(cateringMenuTask?.status).toBe('at_risk');

    const decorPlanTask = tasks.find((t) => t.id === 'decor-installation-plan');
    expect(decorPlanTask).toBeDefined();
    expect(decorPlanTask?.status).toBe('at_risk');

    const rehearsalTask = tasks.find((t) => t.id === 'rehearsal-walkthrough');
    expect(rehearsalTask).toBeDefined();
    expect(rehearsalTask?.status).toBe('at_risk');
  });

  // Test 8: Throws error if non-existent task is cancelled
  it('throws an error if non-existent task ID is cancelled', () => {
    const timeline = buildWeddingTimeline('2026-12-31');
    expect(() => cancelVendorTask(timeline, 'ghost-task-id')).toThrow(
      /Task with id "ghost-task-id" was not found/i
    );
  });
});
