import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingTab from '../src/components/OnboardingTab';
import BudgetTab from '../src/components/BudgetTab';
import VendorsTab from '../src/components/VendorsTab';
import { EventSetup, EMPTY_SETUP } from '../src/types/plan';

describe('React Testing Library — Core User Flows', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Flow 1: Intake text -> parse -> fields populate ─────────────────────────
  it('Flow 1: intake brief auto-fills event setup fields', async () => {
    const handleSetupChange = vi.fn();
    const handleReady = vi.fn();

    const mockParsedResponse = {
      data: {
        occasion: 'wedding',
        date: '2027-02-15',
        budget: 2500000,
        guestCount: 200,
        city: 'Mumbai',
        priorities: ['food', 'photography'],
      },
      demo: true,
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockParsedResponse,
    });

    render(
      <OnboardingTab setup={EMPTY_SETUP} onSetupChange={handleSetupChange} onReady={handleReady} />
    );

    // Click "Load sample brief"
    const loadSampleBtn = screen.getByRole('button', { name: /load sample brief/i });
    fireEvent.click(loadSampleBtn);

    const textarea = screen.getByLabelText(/event description/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('wedding in Mumbai');

    // Click "Auto-fill fields"
    const autoFillBtn = screen.getByRole('button', { name: /auto-fill fields/i });
    fireEvent.click(autoFillBtn);

    await waitFor(() => {
      expect(handleSetupChange).toHaveBeenCalledWith(
        expect.objectContaining({
          occasion: 'wedding',
          date: '2027-02-15',
          budget: '2500000',
          guestCount: '200',
          city: 'Mumbai',
          priorities: ['food', 'photography'],
        })
      );
    });
  });

  // ── Flow 2: Slider change -> recalculate -> tradeoff explanation renders ────
  it('Flow 2: adjust budget/guests triggers recalculation and renders tradeoff explanation', async () => {
    // Mock scrollIntoView for jsdom
    Element.prototype.scrollIntoView = vi.fn();

    const setup: EventSetup = {
      occasion: 'wedding',
      date: '2027-02-15',
      budget: '2500000',
      guestCount: '200',
      city: 'Mumbai',
      priorities: ['food', 'photography'],
    };

    const mockExplainResponse = {
      data: {
        explanation:
          'Adjusted catering to cover 250 guests while shifting ₹50,000 from decor to maintain budget discipline.',
      },
      demo: false,
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/explain-changes')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockExplainResponse,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: { ideas: [] }, demo: true }),
      });
    });

    render(<BudgetTab setup={setup} />);

    // Initial budget breakdown renders
    expect(screen.getByText(/Budget breakdown/i)).toBeDefined();

    // Adjust guest count input
    const guestsInput = screen.getByLabelText(/guest count/i) as HTMLInputElement;
    fireEvent.change(guestsInput, { target: { value: '250' } });
    expect(guestsInput.value).toBe('250');

    // Click Recalculate
    const recalcBtn = screen.getByRole('button', { name: /recalculate/i });
    fireEvent.click(recalcBtn);

    // Tradeoff explanation should appear
    await waitFor(() => {
      expect(screen.getByText(/What changed and why/i)).toBeDefined();
      expect(screen.getByText(/Adjusted catering to cover 250 guests/i)).toBeDefined();
    });
  });

  // ── Flow 3: Vendor added -> checklist toggled -> AI inquiry drafted ─────────
  it('Flow 3: adds vendor quote, toggles checklist items, and drafts AI inquiry message', async () => {
    const mockDraftResponse = {
      data: {
        message:
          'Hello Royal Banquets, thank you for sharing your quote. Could you please confirm if taxes/GST are included and your cancellation policy?',
      },
      demo: false,
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockDraftResponse,
    });

    render(<VendorsTab />);

    // Initially shows empty state
    expect(screen.getByText(/No vendors added yet/i)).toBeDefined();

    // Fill in vendor quote form
    const nameInput = screen.getByLabelText(/vendor name/i);
    fireEvent.change(nameInput, { target: { value: 'Royal Banquets' } });

    const priceInput = screen.getByLabelText(/quoted price/i);
    fireEvent.change(priceInput, { target: { value: '450000' } });

    const includesInput = screen.getByLabelText(/what's included/i);
    fireEvent.change(includesInput, { target: { value: 'Full banquet hall and basic sound' } });

    // Submit form
    const addBtn = screen.getByRole('button', { name: /\+ add vendor/i });
    fireEvent.click(addBtn);

    // Vendor card appears
    expect(screen.getByText('Royal Banquets')).toBeDefined();
    expect(screen.getByText('₹4,50,000')).toBeDefined();
    expect(screen.getByText(/7 items missing/i)).toBeDefined();

    // Toggle checklist checkbox
    const firstCheckbox = screen.getByLabelText(/Itemized taxes\/GST included/i);
    fireEvent.click(firstCheckbox);

    // Missing count updates to 6
    expect(screen.getByText(/6 items missing/i)).toBeDefined();

    // Click Draft Inquiry button
    const draftBtn = screen.getByRole('button', { name: /draft inquiry/i });
    fireEvent.click(draftBtn);

    // Drafted message appears
    await waitFor(() => {
      expect(screen.getByText(/Drafted Inquiry Message/i)).toBeDefined();
      expect(
        screen.getByText(/Hello Royal Banquets, thank you for sharing your quote/i)
      ).toBeDefined();
    });

    // Copy drafted message
    const copyBtn = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyBtn);
    expect(screen.getByText(/✓ Copied!/i)).toBeDefined();

    // Remove vendor
    const removeBtn = screen.getByRole('button', { name: /remove vendor royal banquets/i });
    fireEvent.click(removeBtn);
    expect(screen.queryByText('Royal Banquets')).toBeNull();
  });

  // ── Extra coverage for BudgetTab & OnboardingTab flows ─────────────────────────
  it('handles OnboardingTab priority toggling and validation warnings', () => {
    const handleSetup = vi.fn();
    const handleReady = vi.fn();

    const setupWithPartial: EventSetup = {
      occasion: 'wedding',
      date: '2027-02-15',
      budget: '2500000',
      guestCount: '200',
      city: 'Mumbai',
      priorities: ['food'],
    };

    render(
      <OnboardingTab setup={setupWithPartial} onSetupChange={handleSetup} onReady={handleReady} />
    );

    // Toggle decor priority
    const decorChip = screen.getByRole('checkbox', { name: /decor/i });
    fireEvent.click(decorChip);
    expect(handleSetup).toHaveBeenCalledWith(
      expect.objectContaining({ priorities: ['food', 'decor'] })
    );

    // Toggle off food priority
    const foodChip = screen.getByRole('checkbox', { name: /food/i });
    fireEvent.click(foodChip);
    expect(handleSetup).toHaveBeenCalledWith(expect.objectContaining({ priorities: [] }));

    // Click Continue to Budget
    const continueBtn = screen.getByRole('button', { name: /continue to budget/i });
    fireEvent.click(continueBtn);
    expect(handleReady).toHaveBeenCalled();
  });

  it('handles BudgetTab export and input validation errors', () => {
    const setup: EventSetup = {
      occasion: 'wedding',
      date: '2027-02-15',
      budget: '2500000',
      guestCount: '200',
      city: 'Mumbai',
      priorities: ['food'],
    };

    render(<BudgetTab setup={setup} />);

    // Click Export plan
    const exportBtn = screen.getByRole('button', { name: /export plan/i });
    fireEvent.click(exportBtn);

    // Enter invalid guest count (< 1)
    const guestsInput = screen.getByLabelText(/guest count/i);
    fireEvent.change(guestsInput, { target: { value: '0' } });
    const recalcBtn = screen.getByRole('button', { name: /recalculate/i });
    fireEvent.click(recalcBtn);
    expect(screen.getByText(/Guest count must be at least 1/i)).toBeDefined();

    // Enter invalid budget (<= 0)
    fireEvent.change(guestsInput, { target: { value: '200' } });
    const budgetInput = screen.getByLabelText(/total budget/i);
    fireEvent.change(budgetInput, { target: { value: '-100' } });
    fireEvent.click(recalcBtn);
    expect(screen.getByText(/Total budget must be greater than zero/i)).toBeDefined();
  });
});
