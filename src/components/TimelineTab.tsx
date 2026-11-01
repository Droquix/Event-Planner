'use client';

import React, { useEffect, useState } from 'react';
import { buildWeddingTimelineWithFeasibility, cancelVendorTask, type Task } from '../lib/timeline';
import { Card } from './ui';
import { CalendarIcon } from './icons';
import { EventSetup } from '../types/plan';
import { TimelineStatsCards } from './timeline/TimelineStatsCards';
import { TimelineActionAlert } from './timeline/TimelineActionAlert';
import { TimelineTasksTable } from './timeline/TimelineTasksTable';

interface Props {
  setup: EventSetup;
  onGoToOnboarding?: () => void;
}

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
        .filter(
          (t) => t.status === 'at_risk' && tasks.find((o) => o.id === t.id)?.status !== 'at_risk'
        )
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
              Set an event date in Onboarding to calculate milestones backwards, evaluate lead
              times, and monitor dependencies.
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
    return (
      <p role="alert" style={{ color: '#fca5a5', padding: 20 }}>
        {error}
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Left-Aligned Hero Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
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
      <TimelineStatsCards totalTasks={tasks.length} counts={counts} />

      {/* Action Required Alert & Cancellation banner */}
      <TimelineActionAlert warnings={warnings} lastCancelMsg={lastCancelMsg} />

      {/* Wedding timeline table */}
      <TimelineTasksTable
        tasks={displayedTasks}
        eventDate={eventDate}
        filterActive={filterActive}
        onToggleFilter={() => setFilterActive(!filterActive)}
        onCancelTask={handleCancel}
      />
    </div>
  );
}
