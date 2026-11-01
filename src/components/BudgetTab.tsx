'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createBudgetPlan, recalculate, type BudgetPlan, type BudgetDifference } from '../lib/budget';
import { WarningList, LiveRegion } from './ui';
import type { EventSetup } from '../types/plan';
import { useAbortableRequest } from '../hooks/useAbortableRequest';
import { type IdeaItem, DEFAULT_IDEAS } from './budget/types';
import { BudgetSlidersCard } from './budget/BudgetSlidersCard';
import { BudgetBreakdownTable } from './budget/BudgetBreakdownTable';
import { BudgetTradeoffCard } from './budget/BudgetTradeoffCard';
import { BudgetIdeasGrid } from './budget/BudgetIdeasGrid';
import { BudgetEmptyCard } from './budget/BudgetEmptyCard';
import { BudgetHeader } from './budget/BudgetHeader';

interface Props {
  setup: EventSetup;
  onGoToOnboarding?: () => void;
}

export default function BudgetTab({ setup, onGoToOnboarding }: Props) {
  const [plan, setPlan] = useState<BudgetPlan | null>(null);
  const [error, setError] = useState('');
  const [guests, setGuests] = useState(setup.guestCount || '');
  const [budget, setBudget] = useState(setup.budget || '');
  const [differences, setDifferences] = useState<BudgetDifference[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const diffRef = useRef<HTMLDivElement>(null);

  // AI explanation state
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [explainDemo, setExplainDemo] = useState<boolean | undefined>(undefined);

  // AI ideas state
  const [ideas, setIdeas] = useState<IdeaItem[]>(DEFAULT_IDEAS);
  const [ideasDemo, setIdeasDemo] = useState<boolean | undefined>(true);

  // Abortable requests using shared hook
  const explainRequest = useAbortableRequest<
    { differences: BudgetDifference[] },
    { data?: { explanation: string }; demo?: boolean }
  >(async ({ differences: diffs }, signal) => {
    const res = await fetch('/api/explain-changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ differences: diffs }),
      signal,
    });
    return res.json();
  });

  const ideasRequest = useAbortableRequest<
    { occasion: string; city: string; guestCount: number; surplus: number; priorities: string[] },
    { data?: { ideas: IdeaItem[] }; demo?: boolean }
  >(async (payload, signal) => {
    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    return res.json();
  });

  const fetchIdeas = useCallback(
    async (currentPlan: BudgetPlan) => {
      const json = await ideasRequest.execute({
        occasion: setup.occasion || 'wedding',
        city: setup.city || 'Mumbai',
        guestCount: currentPlan.guestCount,
        surplus: currentPlan.surplus || 0,
        priorities: setup.priorities,
      });
      if (json?.data?.ideas) {
        setIdeas(json.data.ideas);
        setIdeasDemo(json.demo);
      }
    },
    [ideasRequest, setup.city, setup.occasion, setup.priorities]
  );

  useEffect(() => {
    if (!setup.budget || !setup.guestCount) {
      setPlan(null);
      return;
    }
    const b = Number(setup.budget);
    const g = Number(setup.guestCount);
    if (!Number.isFinite(b) || b <= 0 || !Number.isFinite(g) || g < 1) {
      setPlan(null);
      return;
    }

    try {
      const p = createBudgetPlan({
        totalBudget: b,
        guestCount: g,
        occasion: setup.occasion || 'event',
        priorities: setup.priorities,
      });
      setPlan(p);
      setGuests(String(g));
      setBudget(String(b));
      setError('');
      setDifferences([]);
      setAiExplanation('');
      setExplainDemo(undefined);
      fetchIdeas(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create budget plan');
    }
  }, [setup.budget, setup.guestCount, setup.occasion, setup.priorities, fetchIdeas]);

  async function fetchExplanation(diffs: BudgetDifference[]) {
    const json = await explainRequest.execute({ differences: diffs });
    if (json?.data?.explanation) {
      setAiExplanation(json.data.explanation);
      setExplainDemo(json.demo);
    }
  }

  function handleRecalculate() {
    if (!plan) return;
    setError('');

    const g = Number(guests);
    const b = Number(budget);

    if (!Number.isFinite(g) || g < 1) {
      setError('Guest count must be at least 1.');
      return;
    }
    if (g > 100000) {
      setError('Guest count exceeds maximum limit (100,000).');
      return;
    }
    if (!Number.isFinite(b) || b <= 0) {
      setError('Total budget must be greater than zero.');
      return;
    }

    try {
      const result = recalculate(plan, { guestCount: g, totalBudget: b });
      setPlan(result.plan);
      setDifferences(result.differences);

      const changed = result.differences.map((d) => d.category).join(', ');
      setAnnouncement(`Budget updated. Changes: ${changed || 'none'}.`);

      if (result.differences.length > 0) {
        fetchExplanation(result.differences);
      } else {
        setAiExplanation('');
        setExplainDemo(undefined);
      }

      setTimeout(
        () => diffRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        100
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recalculation failed');
    }
  }

  function handleExportPlan() {
    if (!plan) return;
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `budget-plan-${setup.date || 'event'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  if (!plan) {
    return <BudgetEmptyCard onGoToOnboarding={onGoToOnboarding} />;
  }

  const occasionText = setup.occasion || 'wedding';
  const cityText = setup.city || 'Mumbai';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <LiveRegion message={announcement} />

      <BudgetHeader
        occasionText={occasionText}
        cityText={cityText}
        onExport={handleExportPlan}
      />

      {/* Card 1: Adjust budget & guests */}
      <BudgetSlidersCard
        guests={guests}
        budget={budget}
        error={error}
        onGuestsChange={setGuests}
        onBudgetChange={setBudget}
        onRecalculate={handleRecalculate}
      />

      {/* Warnings Banner */}
      {plan.warnings && plan.warnings.length > 0 && <WarningList warnings={plan.warnings} />}

      {/* Card 2: Budget Breakdown Table */}
      <BudgetBreakdownTable plan={plan} />

      {/* Card 3: What changed and why */}
      <div ref={diffRef}>
        <BudgetTradeoffCard
          differences={differences}
          aiExplanation={aiExplanation}
          explainLoading={explainRequest.loading}
          explainDemo={explainDemo}
        />
      </div>

      {/* Card 4: AI Personalized Ideas Grid */}
      <BudgetIdeasGrid
        ideas={ideas}
        ideasLoading={ideasRequest.loading}
        ideasDemo={ideasDemo}
        occasionText={occasionText}
        cityText={cityText}
        onRefreshIdeas={() => plan && fetchIdeas(plan)}
      />
    </div>
  );
}
