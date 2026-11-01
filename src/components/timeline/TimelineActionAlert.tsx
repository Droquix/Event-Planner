import React from 'react';

export interface TimelineActionAlertProps {
  warnings: string[];
  lastCancelMsg: string;
}

export const TimelineActionAlert: React.FC<TimelineActionAlertProps> = ({
  warnings,
  lastCancelMsg,
}) => {
  return (
    <>
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
    </>
  );
};
