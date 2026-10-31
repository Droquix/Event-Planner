'use client';

import React, { useEffect, useState } from 'react';
import {
  buildWeddingTimelineWithFeasibility,
  cancelVendorTask,
  type Task,
} from '../lib/timeline';
import {
  Btn, Card, SectionHeading, WarningList, StatusBadge,
} from './ui';
import type { EventSetup } from './OnboardingTab';

interface Props {
  setup: EventSetup;
}

// Tasks that represent a vendor booking (can be cancelled)
const VENDOR_TASK_IDS = new Set([
  'book-venue', 'hire-caterer', 'hire-photographer', 'hire-decorator',
]);

export default function TimelineTab({ setup }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const [lastCancelMsg, setLastCancelMsg] = useState('');

  useEffect(() => {
    if (!setup.date) return;
    setError('');
    setCancelledIds(new Set());
    setLastCancelMsg('');
    try {
      const result = buildWeddingTimelineWithFeasibility(
        setup.date,
        undefined,
        new Date().toISOString().split('T')[0]
      );
      setTasks(result.tasks);
      setWarnings(result.warnings);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build timeline');
    }
  }, [setup.date]);

  function handleCancel(taskId: string) {
    try {
      const updated = cancelVendorTask(tasks, taskId);
      const task = tasks.find((t) => t.id === taskId);
      const affected = updated
        .filter((t) => t.status === 'at_risk' && tasks.find((o) => o.id === t.id)?.status !== 'at_risk')
        .map((t) => t.name);
      setTasks(updated);
      setCancelledIds((prev) => new Set([...prev, taskId]));
      setLastCancelMsg(
        `"${task?.name}" cancelled.` +
        (affected.length ? ` Now at risk: ${affected.join(', ')}.` : '')
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed');
    }
  }

  if (!setup.date) {
    return (
      <div style={{ color: '#94a3b8', padding: 20, textAlign: 'center' }}>
        Please set an event date in the Onboarding tab first.
      </div>
    );
  }

  if (error) {
    return <p role="alert" style={{ color: '#fca5a5', padding: 20 }}>{error}</p>;
  }

  // Group overdue / at_risk / ok for summary counts
  const counts = tasks.reduce(
    (acc, t) => {
      const s = t.status ?? 'pending';
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Summary */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {[
          { label: 'Total tasks',  value: tasks.length, color: '#94a3b8' },
          { label: 'Overdue',      value: counts['overdue'] ?? 0,  color: '#fda4af' },
          { label: 'At risk',      value: counts['at_risk'] ?? 0,  color: '#fde68a' },
          { label: 'Pending',      value: counts['pending'] ?? 0,  color: '#93c5fd' },
          { label: 'Cancelled',    value: counts['cancelled'] ?? 0, color: '#a1a1aa' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
              padding: '10px 18px', textAlign: 'center', minWidth: 90,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Overdue warnings */}
      {warnings.length > 0 && <WarningList warnings={warnings} />}

      {/* Cancel notification */}
      {lastCancelMsg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: '#1c1917', border: '1px solid #78350f', borderRadius: 10,
            padding: '10px 16px', color: '#fde68a', fontSize: 13,
          }}
        >
          ℹ️ {lastCancelMsg}
        </div>
      )}

      {/* Task list */}
      <Card style={{ overflowX: 'auto' }}>
        <SectionHeading>Wedding timeline — event: {setup.date}</SectionHeading>
        <table
          role="table"
          aria-label="Wedding tasks by dependency order"
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}
        >
          <thead>
            <tr>
              {['#', 'Task', 'Deadline', 'Lead time', 'Depends on', 'Status', ''].map((h) => (
                <th
                  key={h}
                  scope="col"
                  style={{
                    padding: '8px 10px', textAlign: 'left',
                    color: '#64748b', fontWeight: 600, fontSize: 12,
                    borderBottom: '1px solid #334155', whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, idx) => {
              const status = task.status ?? 'pending';
              const rowBg =
                status === 'overdue' ? '#1a0a0a' :
                status === 'at_risk' ? '#1a1200' :
                status === 'cancelled' ? '#111' : 'transparent';
              const isVendor = VENDOR_TASK_IDS.has(task.id);
              const isCancelled = status === 'cancelled';

              return (
                <tr
                  key={task.id}
                  style={{ background: rowBg, borderBottom: '1px solid #1e3a5f' }}
                >
                  <td style={{ padding: '10px 10px', color: '#475569', fontSize: 12 }}>{idx + 1}</td>
                  <td style={{ padding: '10px 10px', fontWeight: 600, color: isCancelled ? '#52525b' : '#e2e8f0' }}>
                    {task.name}
                    {isVendor && (
                      <span
                        aria-label="vendor task"
                        title="This is a vendor booking task"
                        style={{ fontSize: 10, color: '#a855f7', marginLeft: 6 }}
                      >
                        VENDOR
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {task.deadline ?? '—'}
                  </td>
                  <td style={{ padding: '10px 10px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {task.daysBeforeEvent}d before
                  </td>
                  <td style={{ padding: '10px 10px', color: '#475569', fontSize: 12 }}>
                    {task.dependsOn.length
                      ? task.dependsOn.join(', ')
                      : <span style={{ color: '#334155' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    <StatusBadge status={status === 'pending' && false ? 'ok' : status} />
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    {isVendor && !isCancelled && (
                      <Btn
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancel(task.id)}
                        aria-label={`Cancel vendor task: ${task.name}`}
                      >
                        Cancel vendor
                      </Btn>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
