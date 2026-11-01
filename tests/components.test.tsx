import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimelineTab from '../src/components/TimelineTab';
import {
  StatusBadge,
  AIBadge,
  WarningList,
  Btn,
  Field,
  SelectField,
  Card,
  SectionHeading,
  fmt,
} from '../src/components/ui';
import {
  SparklesIcon,
  CalendarIcon,
  SlidersIcon,
  DownloadIcon,
  FilterIcon,
  HandshakeIcon,
  InboxIcon,
  AlertCircleIcon,
  DotsIcon,
} from '../src/components/icons';
import { VendorComparisonTable } from '../src/components/vendors/VendorComparisonTable';
import { VendorEmptyState } from '../src/components/vendors/VendorEmptyState';
import { VendorQuote } from '../src/components/vendors/types';
import { OnboardingDetailsCard } from '../src/components/onboarding/OnboardingDetailsCard';
import { OnboardingBriefCard } from '../src/components/onboarding/OnboardingBriefCard';
import { BudgetSlidersCard } from '../src/components/budget/BudgetSlidersCard';
import { BudgetIdeasGrid } from '../src/components/budget/BudgetIdeasGrid';
import { EmptyBoxIcon } from '../src/components/icons';
import { handleInternalError } from '../src/lib/api-handler';
import { EventSetup } from '../src/types/plan';

describe('UI Primitives and TimelineTab Component Coverage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── TimelineTab Tests ────────────────────────────────────────────────────────
  describe('TimelineTab', () => {
    it('renders empty date state when event date is missing', () => {
      const handleGoToOnboarding = vi.fn();
      render(
        <TimelineTab
          setup={{
            occasion: 'wedding',
            date: '',
            budget: '2500000',
            guestCount: '200',
            city: 'Mumbai',
            priorities: [],
          }}
          onGoToOnboarding={handleGoToOnboarding}
        />
      );

      expect(screen.getByText(/No event date selected/i)).toBeDefined();
      const btn = screen.getByRole('button', { name: /Go to Onboarding/i });
      fireEvent.click(btn);
      expect(handleGoToOnboarding).toHaveBeenCalled();
    });

    it('renders timeline tasks, handles vendor cancellation, and toggles filters', () => {
      const validSetup: EventSetup = {
        occasion: 'wedding',
        date: '2027-02-15',
        budget: '2500000',
        guestCount: '200',
        city: 'Mumbai',
        priorities: ['venue'],
      };

      render(<TimelineTab setup={validSetup} />);

      // Tasks table rendered
      expect(screen.getByText(/Wedding timeline — event: 2027-02-15/i)).toBeDefined();
      expect(screen.getByText('Book Wedding Venue')).toBeDefined();

      // Cancel a vendor task
      const cancelBtns = screen.getAllByRole('button', { name: /cancel vendor/i });
      expect(cancelBtns.length).toBeGreaterThan(0);
      fireEvent.click(cancelBtns[0]);

      // Cancellation status feedback appears
      expect(screen.getByText(/cancelled\. Downstream tasks now at risk/i)).toBeDefined();

      // Toggle filter
      const filterBtn = screen.getByRole('button', { name: /filter tasks/i });
      fireEvent.click(filterBtn);
      expect(screen.getByRole('button', { name: /show all tasks/i })).toBeDefined();
    });
  });

  // ── VendorComparisonTable Tests ──────────────────────────────────────────────
  describe('VendorComparisonTable and VendorEmptyState', () => {
    it('renders side-by-side comparison with lowest-price badge', () => {
      const mockQuotes: VendorQuote[] = [
        {
          id: 'v1',
          name: 'Grand Palace',
          category: 'venue',
          price: 500000,
          includes: 'Hall and lawn',
          checklist: { 'Itemized taxes/GST included': true },
        },
        {
          id: 'v2',
          name: 'Budget Hall',
          category: 'venue',
          price: 350000,
          includes: 'Indoor hall only',
          checklist: {},
        },
      ];

      render(<VendorComparisonTable category="venue" vendors={mockQuotes} />);

      expect(screen.getByText(/Compare Venue vendors/i)).toBeDefined();
      expect(screen.getByText('Budget Hall')).toBeDefined();
      expect(screen.getByText('lowest')).toBeDefined();
    });

    it('toggles guide modal in VendorEmptyState', () => {
      render(<VendorEmptyState />);
      const guideBtn = screen.getByRole('button', { name: /learn how quotes work/i });
      fireEvent.click(guideBtn);
      expect(screen.getByText(/Vendor Management Tips/i)).toBeDefined();
    });
  });

  // ── UI Primitives Tests ──────────────────────────────────────────────────────
  describe('UI Primitives (src/components/ui.tsx)', () => {
    it('renders all StatusBadge variants', () => {
      const { rerender } = render(<StatusBadge status="overdue" />);
      expect(screen.getByText('OVERDUE')).toBeDefined();

      rerender(<StatusBadge status="at_risk" />);
      expect(screen.getByText('AT RISK')).toBeDefined();

      rerender(<StatusBadge status="cancelled" />);
      expect(screen.getByText('CANCELLED')).toBeDefined();

      rerender(<StatusBadge status="pending" />);
      expect(screen.getByText('PENDING')).toBeDefined();
    });

    it('renders all AIBadge states', () => {
      const { rerender } = render(<AIBadge loading={true} />);
      expect(screen.getByText(/Analyzing with AI/i)).toBeDefined();

      rerender(<AIBadge demo={true} />);
      expect(screen.getByText(/Demo mode - sample response/i)).toBeDefined();

      rerender(<AIBadge demo={false} />);
      expect(screen.getByText(/Live AI/i)).toBeDefined();

      rerender(<AIBadge demo={undefined} />);
      expect(screen.queryByText(/Live AI/i)).toBeNull();
    });

    it('renders WarningList and hides when empty', () => {
      const { rerender } = render(<WarningList warnings={['Warning 1', 'Warning 2']} />);
      expect(screen.getByText('Warning 1')).toBeDefined();

      rerender(<WarningList warnings={[]} />);
      expect(screen.queryByText('Warning 1')).toBeNull();
    });

    it('renders Field and SelectField components', () => {
      render(
        <div>
          <Field id="test-field" label="Test Label" helpText="Some help" defaultValue="123" />
          <SelectField id="test-select" label="Select Label" defaultValue="a">
            <option value="a">Option A</option>
          </SelectField>
          <Card>
            <SectionHeading>Section Title</SectionHeading>
          </Card>
        </div>
      );

      expect(screen.getByLabelText('Test Label')).toBeDefined();
      expect(screen.getByText('Some help')).toBeDefined();
      expect(screen.getByLabelText('Select Label')).toBeDefined();
      expect(screen.getByText('Section Title')).toBeDefined();
    });

    it('renders all Btn variants', () => {
      render(
        <div>
          <Btn variant="primary">Primary</Btn>
          <Btn variant="secondary">Secondary</Btn>
          <Btn variant="danger">Danger</Btn>
          <Btn variant="outline-pill">Pill</Btn>
          <Btn variant="ghost">Ghost</Btn>
        </div>
      );

      expect(screen.getByText('Primary')).toBeDefined();
      expect(screen.getByText('Secondary')).toBeDefined();
      expect(screen.getByText('Danger')).toBeDefined();
      expect(screen.getByText('Pill')).toBeDefined();
      expect(screen.getByText('Ghost')).toBeDefined();
    });

    it('formats currency correctly with fmt()', () => {
      expect(fmt(2500000)).toBe('₹25,00,000');
    });
  });

  // ── Icon Primitives Tests ────────────────────────────────────────────────────
  describe('Icons (src/components/icons.tsx)', () => {
    it('renders all icon SVGs', () => {
      render(
        <div>
          <SparklesIcon />
          <CalendarIcon />
          <SlidersIcon />
          <DownloadIcon />
          <FilterIcon />
          <HandshakeIcon />
          <InboxIcon />
          <EmptyBoxIcon />
          <AlertCircleIcon />
          <DotsIcon />
        </div>
      );
    });
  });

  // ── Subcomponent Tests ───────────────────────────────────────────────────────
  describe('Modular Subcomponents', () => {
    it('renders and updates OnboardingDetailsCard fields', () => {
      const handleFieldChange = vi.fn();
      const setup: EventSetup = {
        occasion: 'wedding',
        date: '2027-02-15',
        budget: '2500000',
        guestCount: '200',
        city: 'Mumbai',
        priorities: [],
      };

      render(<OnboardingDetailsCard setup={setup} onFieldChange={handleFieldChange} />);

      const cityInput = screen.getByPlaceholderText(/e\.g\. Mumbai/i);
      fireEvent.change(cityInput, { target: { value: 'Pune' } });
      expect(handleFieldChange).toHaveBeenCalledWith('city', 'Pune');
    });

    it('renders OnboardingBriefCard with error and loading state', () => {
      const handleText = vi.fn();
      const handleParse = vi.fn();
      const handleLoadSample = vi.fn();

      render(
        <OnboardingBriefCard
          text="Sample brief text"
          parsing={true}
          parseError="Something went wrong"
          aiDemo={true}
          onTextChange={handleText}
          onParse={handleParse}
          onLoadSample={handleLoadSample}
        />
      );

      expect(screen.getByText('Something went wrong')).toBeDefined();
      expect(screen.getAllByText(/Analyzing with AI/i).length).toBeGreaterThan(0);
    });

    it('renders BudgetSlidersCard with error message and inputs', () => {
      const handleGuests = vi.fn();
      const handleBudget = vi.fn();
      const handleRecalc = vi.fn();

      render(
        <BudgetSlidersCard
          guests="200"
          budget="2500000"
          error="Invalid budget range"
          onGuestsChange={handleGuests}
          onBudgetChange={handleBudget}
          onRecalculate={handleRecalc}
        />
      );

      expect(screen.getByText('Invalid budget range')).toBeDefined();
      const guestsInput = screen.getByLabelText(/guest count/i);
      fireEvent.change(guestsInput, { target: { value: '250' } });
      expect(handleGuests).toHaveBeenCalledWith('250');
    });

    it('renders BudgetIdeasGrid and handles refresh', () => {
      const handleRefresh = vi.fn();
      const mockIdeas = [{ title: 'Idea 1', whyItFits: 'Fits well', costRange: '₹10k - ₹20k' }];

      render(
        <BudgetIdeasGrid
          ideas={mockIdeas}
          ideasLoading={false}
          ideasDemo={true}
          occasionText="wedding"
          cityText="Mumbai"
          onRefreshIdeas={handleRefresh}
        />
      );

      expect(screen.getByText('1. Idea 1')).toBeDefined();
      const refreshBtn = screen.getByRole('button', { name: /refresh ideas/i });
      fireEvent.click(refreshBtn);
      expect(handleRefresh).toHaveBeenCalled();
    });
  });

  // ── api-handler.ts Tests ─────────────────────────────────────────────────────
  describe('api-handler.ts', () => {
    it('creates sanitized 500 response without stack traces', async () => {
      const res = handleInternalError('parse brief');
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe('Failed to parse brief. Please try again.');
      expect(json.stack).toBeUndefined();
    });
  });
});
