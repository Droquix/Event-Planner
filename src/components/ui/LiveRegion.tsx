'use client';

import React from 'react';

/**
 * Visually hidden ARIA live region ensuring screen-reader announcements on dynamic budget updates.
 */
export function LiveRegion({ message }: { message: string }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        border: 0,
      }}
    >
      {message}
    </div>
  );
}
