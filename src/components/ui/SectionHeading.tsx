'use client';

import React from 'react';

/**
 * Subheading typography element for standardizing section labels.
 */
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: '#f8fafc',
        marginBottom: 16,
      }}
    >
      {children}
    </h2>
  );
}
