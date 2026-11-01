import React, { useState, useEffect } from 'react';
import { Card } from '../ui';
import { InboxIcon } from '../icons';

const VendorGuideBox: React.FC = () => (
  <div
    role="region"
    aria-label="Vendor Management Guide"
    style={{
      marginTop: 20,
      maxWidth: 440,
      background: '#070d19',
      border: '1px solid #1e293b',
      borderRadius: 8,
      padding: '14px 18px',
      textAlign: 'left',
      fontSize: 12,
      color: '#94a3b8',
      lineHeight: 1.6,
    }}
  >
    <strong style={{ color: '#f8fafc', display: 'block', marginBottom: 4 }}>
      💡 Vendor Management Tips:
    </strong>
    Collect 2-3 quotes per category. Use our 7-item checklist to check for hidden costs
    (taxes, overtime, cancellation terms). Click &quot;Draft inquiry&quot; on any vendor to
    let our AI write a polite clarification email.
  </div>
);

export const VendorEmptyState: React.FC = () => {
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    if (!showGuideModal) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowGuideModal(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGuideModal]);

  return (
    <Card
      style={{
        padding: '56px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: '#0d1829',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <InboxIcon size={24} color="#38bdf8" />
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
        No vendors added yet.
      </h3>
      <p style={{ fontSize: 13, color: '#64748b', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.5 }}>
        Add your first quote above to begin building a trusted wedding team.
      </p>

      <button
        type="button"
        onClick={() => setShowGuideModal((prev) => !prev)}
        aria-expanded={showGuideModal}
        style={{
          background: '#131c31',
          border: '1px solid #1e293b',
          borderRadius: 8,
          padding: '10px 18px',
          minHeight: 44,
          color: '#f8fafc',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.15s ease',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#131c31')}
      >
        Learn how quotes work
      </button>

      {showGuideModal && <VendorGuideBox />}
    </Card>
  );
};
