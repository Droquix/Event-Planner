'use client';

import React, { useEffect, useState } from 'react';
import {
  buildWeddingTimelineWithFeasibility,
  cancelVendorTask,
  type Task,
} from '../lib/timeline';
import { Card, StatusBadge } from './ui';
import { CalendarIcon, FilterIcon } from './icons';
import type { EventSetup } from './OnboardingTab';

interface Props {
  setup: EventSetup;
  onGoToOnboarding?: () => void;
}

// Tasks that represent a vendor booking (can be cancelled)
const VENDOR_TASK_IDS = new Set([
  'book-venue', 'hire-caterer', 'hire-photographer', 'hire-decorator',
]);

export default function TimelineTab({ setup, onGoToOnboarding }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [lastCancelMsg, setLastCancelMsg] = useState('');
  const [filterActive, setFilterActive] = useState(false);

  const eventDate = setup.date;

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

  // Count metrics for the 5 stats boxes
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

  if (!eventDate) {
    return (
      <div style={{ padding: '20px 0' }}>
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ maxWidth: 440, margin: '0 auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>
              No event date selected
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
              Set an event date in Onboarding to calculate milestones backwards, evaluate lead times, and monitor dependencies.
            </p>
            {onGoToOnboarding && (
              <button
                type="button"
                onClick={onGoToOnboarding}
                style={{
                  background: '#60a5fa',
                  color: '#070d19',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Go to Onboarding →
              </button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return <p role="alert" style={{ color: '#fca5a5', padding: 20 }}>{error}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Top Left-Aligned Hero Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#38bdf8',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            PLANNING PULSE
          </p>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Keep every wedding decision moving.
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, margin: 0 }}>
            A clear view of what needs attention before the big day.
          </p>
        </div>

        <button
          type="button"
          style={{
            background: '#131c31',
            border: '1px solid #1e293b',
            borderRadius: 8,
            padding: '8px 14px',
            color: '#cbd5e1',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#131c31')}
        >
          <CalendarIcon size={14} color="#94a3b8" />
          <span>View calendar</span>
        </button>
      </div>

      {/* 5 Stats Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
        }}
      >
        {[
          { label: 'Total tasks',  value: tasks.length, color: '#f8fafc', border: '#182235' },
          { label: 'Overdue',      value: counts['overdue'] ?? 0,  color: '#f87171', border: 'rgba(244, 63, 94, 0.4)' },
          { label: 'At risk',      value: counts['at_risk'] ?? 0,  color: '#38bdf8', border: '#182235' },
          { label: 'Pending',      value: counts['pending'] ?? 0,  color: '#f8fafc', border: '#182235' },
          { label: 'Cancelled',    value: counts['cancelled'] ?? 0, color: '#f8fafc', border: '#182235' },
        ].map(({ label, value, color, border }) => (
          <div
            key={label}
            style={{
              background: '#0d1527',
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: '16px 18px',
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Action Required Banner (matches screenshot with exclamation mark) */}
      {warnings.length > 0 && (
        <div
          role="region"
          aria-label="Overdue Tasks Action Required"
          style={{
            background: 'rgba(244, 63, 94, 0.04)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              background: '#f87171',
              color: '#070d19',
              width: 20,
              height: 20,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 12,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            !
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '0 0 6px' }}>
              Action required
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {warnings.map((w, idx) => (
                <p key={idx} style={{ color: '#cbd5e1', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                  {w}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Notification feedback */}
      {lastCancelMsg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: '#131c31',
            border: '1px solid #1e293b',
            borderRadius: 10,
            padding: '10px 16px',
            color: '#fde68a',
            fontSize: 12,
          }}
        >
          ℹ️ {lastCancelMsg}
        </div>
      )}

      {/* Card: Wedding timeline table */}
      <Card style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Wedding timeline — event: {eventDate}
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
              Dependencies and due dates in one calm workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFilterActive(!filterActive)}
            style={{
              background: filterActive ? '#1e293b' : '#131c31',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '6px 14px',
              color: '#cbd5e1',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <FilterIcon size={13} color="#94a3b8" />
            <span>{filterActive ? 'Show all tasks' : 'Filter tasks'}</span>
          </button>
        </div>

        <table
          role="table"
          aria-label="Wedding tasks timeline"
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
        >
          <thead>
            <tr>
              {['# TASK', 'DEADLINE', 'LEAD TIME', 'DEPENDS ON', 'STATUS', ''].map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: 11,
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #182235',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedTasks.map((task, idx) => {
              const status = task.status ?? 'pending';
              const isVendor = VENDOR_TASK_IDS.has(task.id);
              const isCancelled = status === 'cancelled';

              return (
                <tr
                  key={task.id}
                  style={{ borderBottom: '1px solid #141f33' }}
                >
                  <td style={{ padding: '13px 14px', fontWeight: 500, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#64748b', marginRight: 10 }}>{idx + 1}</span>
                    <span>{task.name}</span>
                    {isVendor && (
                      <span
                        style={{
                          color: '#60a5fa',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          marginLeft: 8,
                        }}
                      >
                        VENDOR
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '13px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {task.deadline ?? '—'}
                  </td>

                  <td style={{ padding: '13px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {task.daysBeforeEvent}d before
                  </td>

                  <td style={{ padding: '13px 14px', color: '#94a3b8', fontSize: 12 }}>
                    {task.dependsOn.length
                      ? task.dependsOn.join(', ')
                      : <span style={{ color: '#475569' }}>—</span>}
                  </td>

                  <td style={{ padding: '13px 14px' }}>
                    <StatusBadge status={status} />
                  </td>

                  <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                    {isVendor && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleCancel(task.id)}
                        aria-label={`Cancel vendor task: ${task.name}`}
                        style={{
                          background: 'transparent',
                          border: '1px solid #334155',
                          borderRadius: 9999,
                          color: '#cbd5e1',
                          padding: '4px 12px',
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#f87171';
                          e.currentTarget.style.color = '#f87171';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#334155';
                          e.currentTarget.style.color = '#cbd5e1';
                        }}
                      >
                        Cancel vendor
                      </button>
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
