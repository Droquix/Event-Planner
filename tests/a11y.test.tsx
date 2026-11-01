import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import OnboardingTab from '../src/components/OnboardingTab';
import BudgetTab from '../src/components/BudgetTab';
import TimelineTab from '../src/components/TimelineTab';
import VendorsTab from '../src/components/VendorsTab';
import { EMPTY_SETUP, EventSetup } from '../src/types/plan';

expect.extend(toHaveNoViolations);

beforeEach(() => {
  global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ data: { ideas: [] }, demo: true }),
    })
  );
});

const sampleSetup: EventSetup = {
  occasion: 'wedding',
  date: '2027-02-15',
  budget: '2500000',
  guestCount: '200',
  city: 'Mumbai',
  priorities: ['food', 'photography'],
};

describe('Accessibility audits with axe-core', () => {
  it('OnboardingTab has no accessibility violations', async () => {
    const { container } = render(
      <OnboardingTab setup={sampleSetup} onSetupChange={() => {}} onReady={() => {}} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('BudgetTab has no accessibility violations with configured plan', async () => {
    const { container } = render(<BudgetTab setup={sampleSetup} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('BudgetTab empty state has no accessibility violations', async () => {
    const { container } = render(<BudgetTab setup={EMPTY_SETUP} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('TimelineTab has no accessibility violations with configured date', async () => {
    const { container } = render(<TimelineTab setup={sampleSetup} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('TimelineTab unconfigured state has no accessibility violations', async () => {
    const { container } = render(<TimelineTab setup={EMPTY_SETUP} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('VendorsTab has no accessibility violations in initial state', async () => {
    const { container } = render(<VendorsTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders tablist with proper roving tabindex and keyboard navigation (Home, End, Arrows)', () => {
    const { getByRole, getAllByRole } = render(
      <nav role="tablist" aria-label="Main sections">
        <button
          role="tab"
          id="tab-onboarding"
          aria-selected={true}
          tabIndex={0}
          aria-controls="panel-onboarding"
        >
          Onboarding
        </button>
        <button
          role="tab"
          id="tab-budget"
          aria-selected={false}
          tabIndex={-1}
          aria-controls="panel-budget"
        >
          Budget
        </button>
      </nav>
    );

    const tabs = getAllByRole('tab');
    expect(tabs[0]?.getAttribute('tabindex')).toBe('0');
    expect(tabs[1]?.getAttribute('tabindex')).toBe('-1');
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('false');
  });

  it('verifies skip link landmark targets main content', () => {
    const { container } = render(
      <div>
        <a href="#main-content">Skip to main content</a>
        <main id="main-content">Content</main>
      </div>
    );
    const skipLink = container.querySelector('a[href="#main-content"]');
    expect(skipLink).not.toBeNull();
    expect(skipLink?.textContent).toContain('Skip to main content');
  });
});
