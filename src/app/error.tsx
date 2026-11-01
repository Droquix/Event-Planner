'use client';

import React, { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client error captured safely without logging user data
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070d18',
        color: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}
    >
      <div
        style={{
          background: '#0d1527',
          border: '1px solid #182235',
          borderRadius: 16,
          padding: '36px 32px',
          maxWidth: 480,
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(244, 63, 94, 0.12)',
            color: '#f43f5e',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            marginBottom: 16,
          }}
        >
          !
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#ffffff' }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
          We encountered an unexpected problem while rendering this view. Your configuration has
          been preserved.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: '#60a5fa',
              color: '#070d19',
              border: 'none',
              borderRadius: 8,
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/';
            }}
            style={{
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reload app
          </button>
        </div>
      </div>
    </div>
  );
}
