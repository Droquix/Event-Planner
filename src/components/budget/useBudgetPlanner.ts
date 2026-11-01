import { useState, useEffect, useRef } from 'react';
import { createBudgetPlan, recalculate } from '../../lib/budget';
import type { BudgetPlan, BudgetDifference } from '../../lib/budget';
import type { EventSetup } from '../../types/plan';
import { useBudgetApi } from './useBudgetApi';

function validateRecalcInputs(guests: string, budget: string): { g: number; b: number } | string {
  const g = Number(guests);
  const b = Number(budget);
  if (!Number.isFinite(g) || g < 1) return 'Guest count must be at least 1.';
  if (g > 100000) return 'Guest count exceeds maximum limit (100,000).';
  if (!Number.isFinite(b) || b <= 0) return 'Total budget must be greater than zero.';
  return { g, b };
}

function parseInitialPlan(setup: EventSetup): BudgetPlan | null {
  if (!setup.budget || !setup.guestCount) return null;
  const b = Number(setup.budget);
  const g = Number(setup.guestCount);
  if (!Number.isFinite(b) || b <= 0 || !Number.isFinite(g) || g < 1) return null;
  return createBudgetPlan({
    totalBudget: b,
    guestCount: g,
    occasion: setup.occasion || 'event',
    priorities: setup.priorities,
  });
}

function exportPlanAsJson(plan: BudgetPlan | null, dateStr?: string) {
  if (!plan) return;
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plan, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `budget-plan-${dateStr || 'event'}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function useBudgetPlanner(setup: EventSetup) {
  const [plan, setPlan] = useState<BudgetPlan | null>(null);
  const [error, setError] = useState('');
  const [guests, setGuests] = useState(setup.guestCount || '');
  const [budget, setBudget] = useState(setup.budget || '');
  const [differences, setDifferences] = useState<BudgetDifference[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const diffRef = useRef<HTMLDivElement>(null);

  const api = useBudgetApi(setup);

  useEffect(() => {
    try {
      const p = parseInitialPlan(setup);
      setPlan(p);
      if (p) {
        setGuests(String(p.guestCount));
        setBudget(String(p.totalBudget));
        setError('');
        setDifferences([]);
        api.setAiExplanation('');
        api.setExplainDemo(undefined);
        void api.fetchIdeas(p);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create budget plan');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup.budget, setup.guestCount, setup.occasion, setup.priorities, api.fetchIdeas]);

  function handleRecalculate() {
    if (!plan) return;
    setError('');
    const validation = validateRecalcInputs(guests, budget);
    if (typeof validation === 'string') {
      setError(validation);
      return;
    }
    try {
      const result = recalculate(plan, { guestCount: validation.g, totalBudget: validation.b });
      setPlan(result.plan);
      setDifferences(result.differences);
      setAnnouncement(`Budget updated. Changes: ${result.differences.map((d) => d.category).join(', ') || 'none'}.`);
      if (result.differences.length > 0) {
        void api.fetchExplanation(result.differences);
      } else {
        api.setAiExplanation('');
        api.setExplainDemo(undefined);
      }
      setTimeout(() => diffRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recalculation failed');
    }
  }

  return {
    plan,
    error,
    guests,
    budget,
    differences,
    announcement,
    diffRef,
    aiExplanation: api.aiExplanation,
    explainDemo: api.explainDemo,
    ideas: api.ideas,
    ideasDemo: api.ideasDemo,
    explainLoading: api.explainLoading,
    ideasLoading: api.ideasLoading,
    setGuests,
    setBudget,
    handleRecalculate,
    handleExportPlan: () => exportPlanAsJson(plan, setup.date),
    fetchIdeas: api.fetchIdeas,
  };
}
