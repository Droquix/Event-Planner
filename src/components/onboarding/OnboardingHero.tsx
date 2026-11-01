import React from 'react';

interface Props {
  occasion: string;
  date: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'your upcoming date';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export const OnboardingHero: React.FC<Props> = ({ occasion, date }) => {
  const occasionLabel = occasion ? occasion.toUpperCase() : 'EVENT';
  const occasionTitle = occasion || 'event';
  const heroDateText = formatDate(date);

  return (
    <div style={{ textAlign: 'center', marginBottom: 12, paddingTop: 8 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#38bdf8',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 14,
        }}
      >
        YOUR {occasionLabel}, CLEARLY PLANNED
      </p>
      <h2
        style={{
          fontSize: 38,
          fontWeight: 600,
          color: '#ffffff',
          lineHeight: 1.18,
          letterSpacing: '-0.02em',
          marginBottom: 14,
        }}
      >
        Shape the {occasionTitle} you want,
        <br />
        then let the details fall into place.
      </h2>
      <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 620, margin: '0 auto', lineHeight: 1.6 }}>
        Start with your event brief. We&apos;ll use it to organize your budget, vendors, and every
        decision leading up to {heroDateText}.
      </p>
    </div>
  );
};
