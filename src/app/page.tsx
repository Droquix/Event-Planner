/**
 * Event Planner — single-page app with 4 tabs matching the visual design specs.
 * All state lives in React only.
 */
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { EMPTY_SETUP, type EventSetup, type TabId } from '../types/plan';
import { AppNavbar } from '../components/AppNavbar';

// Lazy-load tabs to keep initial bundle compact
const OnboardingTab = dynamic(() => import('../components/OnboardingTab'), { ssr: false });
const BudgetTab = dynamic(() => import('../components/BudgetTab'), { ssr: false });
const TimelineTab = dynamic(() => import('../components/TimelineTab'), { ssr: false });
const VendorsTab = dynamic(() => import('../components/VendorsTab'), { ssr: false });

const TABS: readonly { id: TabId; label: string }[] = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'budget', label: 'Budget' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'vendors', label: 'Vendors' },
] as const;

export default function Page() {
  const [active, setActive] = useState<TabId>('onboarding');
  const [setup, setSetup] = useState<EventSetup>(EMPTY_SETUP);
  const [savedBanner, setSavedBanner] = useState(false);
  const [planSessionKey, setPlanSessionKey] = useState(0);

  function handleReady() {
    setActive('budget');
  }

  function handleSavePlan() {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  }

  function handleResetAll() {
    setSetup(EMPTY_SETUP);
    setActive('onboarding');
    setPlanSessionKey((prev) => prev + 1);
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // safe ignore
      }
    }
  }

  const occasionFormatted = setup.occasion
    ? setup.occasion.charAt(0).toUpperCase() + setup.occasion.slice(1)
    : 'New Event';
  const cityFormatted = setup.city || 'Unset Location';
  const dateFormatted = setup.date || 'Date Unset';
  const headerSubtitle = `${occasionFormatted} · ${cityFormatted} · ${dateFormatted}`;

  return (
    <>
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
        onBlur={(e) => (e.currentTarget.style.left = '-9999px')}
      >
        Skip to main content
      </a>

      <div className="bg-grid-pattern" style={{ minHeight: '100vh', padding: '24px 16px 80px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <AppNavbar
            active={active}
            tabs={TABS}
            headerSubtitle={headerSubtitle}
            savedBanner={savedBanner}
            onSelectTab={setActive}
            onResetAll={handleResetAll}
            onSavePlan={handleSavePlan}
          />

          <main id="main-content" key={planSessionKey}>
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
                  <OnboardingTab setup={setup} onSetupChange={setSetup} onReady={handleReady} />
                )}
                {id === 'budget' && (
                  <BudgetTab setup={setup} onGoToOnboarding={() => setActive('onboarding')} />
                )}
                {id === 'timeline' && (
                  <TimelineTab setup={setup} onGoToOnboarding={() => setActive('onboarding')} />
                )}
                {id === 'vendors' && <VendorsTab />}
              </div>
            ))}
          </main>
        </div>
      </div>
    </>
  );
}
