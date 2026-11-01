import React from 'react';

export interface TimelineStatsCardsProps {
  totalTasks: number;
  counts: Record<string, number>;
}

export const TimelineStatsCards: React.FC<TimelineStatsCardsProps> = ({ totalTasks, counts }) => {
  const stats = [
    { label: 'Total tasks', value: totalTasks, color: '#f8fafc', border: '#182235' },
    {
      label: 'Overdue',
      value: counts['overdue'] ?? 0,
      color: '#f87171',
      border: 'rgba(244, 63, 94, 0.4)',
    },
    { label: 'At risk', value: counts['at_risk'] ?? 0, color: '#38bdf8', border: '#182235' },
    { label: 'Pending', value: counts['pending'] ?? 0, color: '#f8fafc', border: '#182235' },
    { label: 'Cancelled', value: counts['cancelled'] ?? 0, color: '#f8fafc', border: '#182235' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
      }}
    >
      {stats.map(({ label, value, color, border }) => (
        <div
          key={label}
          style={{
            background: '#0d1527',
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: '16px 18px',
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>{label}</div>
        </div>
      ))}
    </div>
  );
};
