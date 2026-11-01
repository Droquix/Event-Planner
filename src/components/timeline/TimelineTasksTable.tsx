import React from 'react';
import { Card, StatusBadge } from '../ui';
import { FilterIcon } from '../icons';
import { Task } from '../../lib/timeline';
import { VENDOR_TASK_IDS } from './types';

export interface TimelineTasksTableProps {
  tasks: Task[];
  eventDate: string;
  filterActive: boolean;
  onToggleFilter: () => void;
  onCancelTask: (taskId: string) => void;
}

export const TimelineTasksTable: React.FC<TimelineTasksTableProps> = ({
  tasks,
  eventDate,
  filterActive,
  onToggleFilter,
  onCancelTask,
}) => {
  return (
    <Card style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 18,
        }}
      >
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
          onClick={onToggleFilter}
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
          {tasks.map((task, idx) => {
            const status = task.status ?? 'pending';
            const isVendor = VENDOR_TASK_IDS.has(task.id);
            const isCancelled = status === 'cancelled';

            return (
              <tr key={task.id} style={{ borderBottom: '1px solid #141f33' }}>
                <td
                  style={{
                    padding: '13px 14px',
                    fontWeight: 500,
                    color: '#f8fafc',
                    whiteSpace: 'nowrap',
                  }}
                >
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
                  {task.dependsOn.length ? (
                    task.dependsOn.join(', ')
                  ) : (
                    <span style={{ color: '#475569' }}>—</span>
                  )}
                </td>

                <td style={{ padding: '13px 14px' }}>
                  <StatusBadge status={status} />
                </td>

                <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                  {isVendor && !isCancelled && (
                    <button
                      type="button"
                      onClick={() => onCancelTask(task.id)}
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
  );
};
