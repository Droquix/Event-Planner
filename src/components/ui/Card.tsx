'use client';

import React from 'react';

/**
 * Standard container card with rounded corners, subtle border, and dark backdrop.
 */
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: '#0d1527',
        border: '1px solid #182235',
        borderRadius: 16,
        padding: '24px',
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
