import { useState, useEffect } from 'react';
import { buildWeddingTimelineWithFeasibility, cancelVendorTask } from '../../lib/timeline';
import type { Task } from '../../lib/timeline';

export function useTimelinePlanner(eventDate: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [lastCancelMsg, setLastCancelMsg] = useState('');
  const [filterActive, setFilterActive] = useState(false);

  useEffect(() => {
    if (!eventDate) {
      setTasks([]);
      setWarnings([]);
      return;
    }
    setError('');
    setLastCancelMsg('');
    try {
      const result = buildWeddingTimelineWithFeasibility(
        eventDate,
        undefined,
        new Date().toISOString().split('T')[0]
      );
      setTasks(result.tasks);
      setWarnings(result.warnings);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build timeline');
    }
  }, [eventDate]);

  function handleCancel(taskId: string) {
    try {
      const updated = cancelVendorTask(tasks, taskId);
      const target = tasks.find((t) => t.id === taskId);
      const newlyAtRisk = updated
        .filter((t) => t.status === 'at_risk' && tasks.find((o) => o.id === t.id)?.status !== 'at_risk')
        .map((t) => t.name);

      setTasks(updated);
      setLastCancelMsg(
        `"${target?.name}" cancelled.` +
          (newlyAtRisk.length ? ` Downstream tasks now at risk: ${newlyAtRisk.join(', ')}.` : '')
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed');
    }
  }

  const counts = tasks.reduce(
    (acc, t) => {
      const s = t.status ?? 'pending';
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const displayedTasks = filterActive
    ? tasks.filter((t) => t.status === 'overdue' || t.status === 'at_risk')
    : tasks;

  return {
    tasks,
    warnings,
    error,
    lastCancelMsg,
    filterActive,
    counts,
    displayedTasks,
    setFilterActive,
    handleCancel,
  };
}
