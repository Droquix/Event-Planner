/**
 * Event Planner — single-page app with 4 tabs matching the visual design specs.
 * All state lives in React only.
 */
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import type { EventSetup } from '../components/OnboardingTab';
import { SparklesIcon } from '../components/icons';

// Lazy-load tabs to keep initial bundle compact
const OnboardingTab = dynamic(() => import('../components/OnboardingTab'), { ssr: false });
const BudgetTab     = dynamic(() => import('../components/BudgetTab'),     { ssr: false });
const TimelineTab   = dynamic(() => import('../components/TimelineTab'),   { ssr: false });
const VendorsTab    = dynamic(() => import('../components/VendorsTab'),    { ssr: false });

export type TabId = 'onboarding' | 'budget' | 'timeline' | 'vendors';

const TABS: { id: TabId; label: string }[] = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'budget',     label: 'Budget' },
  { id: 'timeline',   label: 'Timeline' },
  { id: 'vendors',    label: 'Vendors' },
];

const DEFAULT_SETUP: EventSetup = {
  occasion: 'wedding',
  date: '2027-02-15',
  budget: '2500000',
  guestCount: '200',
  city: 'Mumbai',
  priorities: ['food', 'photography'],
};

export default function Page() {
  const [active, setActive] = useState<TabId>('onboarding');
  const [setup, setSetup] = useState<EventSetup>(DEFAULT_SETUP);
  const [savedBanner, setSavedBanner] = useState(false);

  function handleReady() {
    setActive('budget');
  }

  function handleSavePlan() {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  }

  // Format breadcrumb subtitle (e.g. "Wedding · Mumbai · 2027-02-15")
  const occasionFormatted = setup.occasion
    ? setup.occasion.charAt(0).toUpperCase() + setup.occasion.slice(1)
    : 'Wedding';
  const cityFormatted = setup.city || 'Mumbai';
  const dateFormatted = setup.date || '2027-02-15';
  const headerSubtitle = `${occasionFormatted} · ${cityFormatted} · ${dateFormatted}`;

  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 4,
          zIndex: 9999,
          background: '#60a5fa',
          color: '#070d19',
          padding: '8px 16px',
          borderRadius: 6,
          fontWeight: 700,
          fontSize: 13,
        }}
        onFocus={(e) => (e.currentTarget.style.left = '4px')}
        onBlur={(e)  => (e.currentTarget.style.left = '-9999px')}
      >
        Skip to main content
      </a>

      <div className="bg-grid-pattern" style={{ minHeight: '100vh', padding: '24px 16px 80px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          
          {/* Top Encapsulated Floating Navbar */}
          <header
            style={{
              background: '#0d1527',
              border: '1px solid #182235',
              borderRadius: 16,
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 40,
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Left: Brand Icon + Title + Event metadata */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  background: '#60a5fa',
                  color: '#070d19',
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SparklesIcon size={18} color="#070d19" />
              </div>
              <div>
                <h1 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', margin: 0, lineHeight: 1.2 }}>
                  Event Planner
                </h1>
                <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0', lineHeight: 1.2 }}>
                  {headerSubtitle}
                </p>
              </div>
            </div>

            {/* Center: Tabs pill list */}
            <nav
              role="tablist"
              aria-label="Main sections"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(7, 13, 25, 0.6)',
                border: '1px solid rgba(30, 41, 59, 0.7)',
                borderRadius: 9999,
                padding: '3px',
              }}
            >
              {TABS.map(({ id, label }) => {
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
                      background: isCurrent ? '#1c2a47' : 'transparent',
                      border: 'none',
                      borderRadius: 9999,
                      padding: '5px 14px',
                      color: isCurrent ? '#ffffff' : '#94a3b8',
                      fontWeight: isCurrent ? 600 : 500,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      outline: 'none',
                    }}
                    onKeyDown={(e) => {
                      const ids = TABS.map((t) => t.id);
                      const idx = ids.indexOf(id);
                      if (e.key === 'ArrowRight') {
                        setActive(ids[(idx + 1) % ids.length]);
                        e.preventDefault();
                      }
                      if (e.key === 'ArrowLeft') {
                        setActive(ids[(idx - 1 + ids.length) % ids.length]);
                        e.preventDefault();
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* Right: Save plan CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={handleSavePlan}
                style={{
                  background: '#60a5fa',
                  color: '#070d19',
                  border: 'none',
                  borderRadius: 10,
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#3b82f6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#60a5fa')}
              >
                {savedBanner ? '✓ Plan saved!' : 'Save plan'}
              </button>
            </div>
          </header>

          {/* Main Content Panels */}
          <main id="main-content">
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
      </div>
    </>
  );
}
