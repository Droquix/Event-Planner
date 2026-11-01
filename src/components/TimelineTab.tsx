'use client';

import React from 'react';
import type { EventSetup } from '../types/plan';
import { TimelineStatsCards } from './timeline/TimelineStatsCards';
import { TimelineActionAlert } from './timeline/TimelineActionAlert';
import { TimelineTasksTable } from './timeline/TimelineTasksTable';
import { TimelineEmptyState } from './timeline/TimelineEmptyState';
import { useTimelinePlanner } from './timeline/useTimelinePlanner';

interface Props {
  setup: EventSetup;
  onGoToOnboarding?: () => void;
}

export default function TimelineTab({ setup, onGoToOnboarding }: Props) {
  const eventDate = setup.date;
  const {
    tasks,
    warnings,
    error,
    lastCancelMsg,
    filterActive,
    counts,
    displayedTasks,
    setFilterActive,
    handleCancel,
  } = useTimelinePlanner(eventDate);

  if (!eventDate) {
    return <TimelineEmptyState onGoToOnboarding={onGoToOnboarding} />;
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
      <TimelineActionAlert
        lastCancelMsg={lastCancelMsg}
        warnings={warnings}
      />

      <TimelineStatsCards counts={counts} totalTasks={tasks.length} />

      <TimelineTasksTable
        tasks={displayedTasks}
        eventDate={eventDate}
        filterActive={filterActive}
        onToggleFilter={() => setFilterActive((prev) => !prev)}
        onCancelTask={handleCancel}
      />
    </div>
  );
}
