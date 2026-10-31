/**
 * Event Planner — single-page app with 4 tabs.
 * All state lives in React only (no database, no server state).
 */
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import type { EventSetup } from '../components/OnboardingTab';

// Lazy-load heavy tabs to keep initial bundle small
const OnboardingTab = dynamic(() => import('../components/OnboardingTab'), { ssr: false });
const BudgetTab     = dynamic(() => import('../components/BudgetTab'),     { ssr: false });
const TimelineTab   = dynamic(() => import('../components/TimelineTab'),   { ssr: false });
const VendorsTab    = dynamic(() => import('../components/VendorsTab'),    { ssr: false });

type TabId = 'onboarding' | 'budget' | 'timeline' | 'vendors';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'onboarding', label: 'Onboarding',  icon: '📋' },
  { id: 'budget',     label: 'Budget',      icon: '💰' },
  { id: 'timeline',   label: 'Timeline',    icon: '📅' },
  { id: 'vendors',    label: 'Vendors',     icon: '🤝' },
];

const EMPTY_SETUP: EventSetup = {
  occasion: '',
  date: '',
  budget: '',
  guestCount: '',
  city: '',
  priorities: [],
};

export default function Page() {
  const [active, setActive] = useState<TabId>('onboarding');
  const [setup, setSetup] = useState<EventSetup>(EMPTY_SETUP);

  function handleReady() { setActive('budget'); }

  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        style={{
          position: 'absolute', left: '-9999px', top: 4, zIndex: 9999,
          background: '#0ea5e9', color: '#fff', padding: '8px 16px', borderRadius: 6,
          fontWeight: 700, fontSize: 14,
        }}
        onFocus={(e) => (e.currentTarget.style.left = '4px')}
        onBlur={(e)  => (e.currentTarget.style.left = '-9999px')}
      >
        Skip to main content
      </a>

      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}>
        {/* App header */}
        <header
          style={{
            background: '#1e293b',
            borderBottom: '1px solid #334155',
            padding: '0 24px',
          }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0 0' }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                🎉 Event Planner
              </h1>
              {setup.occasion && (
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                  {setup.occasion.charAt(0).toUpperCase() + setup.occasion.slice(1)}
                  {setup.city ? ` · ${setup.city}` : ''}
                  {setup.date ? ` · ${setup.date}` : ''}
                </p>
              )}
            </div>

            {/* Tab navigation */}
            <nav
              role="tablist"
              aria-label="Main sections"
              style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}
            >
              {TABS.map(({ id, label, icon }) => {
                const isCurrent = active === id;
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={isCurrent}
                    aria-controls={`panel-${id}`}
                    id={`tab-${id}`}
                    onClick={() => setActive(id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: isCurrent ? '3px solid #38bdf8' : '3px solid transparent',
                      padding: '10px 16px',
                      color: isCurrent ? '#38bdf8' : '#94a3b8',
                      fontWeight: isCurrent ? 700 : 400,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'color 0.15s, border-color 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                    onKeyDown={(e) => {
                      const ids = TABS.map((t) => t.id);
                      const idx = ids.indexOf(id);
                      if (e.key === 'ArrowRight') { setActive(ids[(idx + 1) % ids.length]); e.preventDefault(); }
                      if (e.key === 'ArrowLeft')  { setActive(ids[(idx - 1 + ids.length) % ids.length]); e.preventDefault(); }
                    }}
                  >
                    <span aria-hidden>{icon}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main
          id="main-content"
          style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px 60px' }}
        >
          {/* Each panel is always mounted but hidden — preserves state */}
          {TABS.map(({ id }) => (
            <div
              key={id}
              id={`panel-${id}`}
              role="tabpanel"
              aria-labelledby={`tab-${id}`}
              hidden={active !== id}
              tabIndex={0}
            >
              {id === 'onboarding' && (
                <OnboardingTab
                  setup={setup}
                  onSetupChange={setSetup}
                  onReady={handleReady}
                />
              )}
              {id === 'budget' && <BudgetTab setup={setup} />}
              {id === 'timeline' && <TimelineTab setup={setup} />}
              {id === 'vendors' && <VendorsTab />}
            </div>
          ))}
        </main>
      </div>
    </>
  );
}
