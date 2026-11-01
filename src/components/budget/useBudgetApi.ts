import { useState, useCallback } from 'react';
import type { BudgetPlan, BudgetDifference } from '../../lib/budget';
import type { EventSetup } from '../../types/plan';
import { useAbortableRequest } from '../../hooks/useAbortableRequest';
import { type IdeaItem, DEFAULT_IDEAS } from './types';

export function useBudgetApi(setup: EventSetup) {
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [explainDemo, setExplainDemo] = useState<boolean | undefined>(undefined);
  const [ideas, setIdeas] = useState<IdeaItem[]>(DEFAULT_IDEAS);
  const [ideasDemo, setIdeasDemo] = useState<boolean | undefined>(true);

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

  const fetchExplanation = useCallback(
    async (diffs: BudgetDifference[]) => {
      const json = await explainRequest.execute({ differences: diffs });
      if (json?.data?.explanation) {
        setAiExplanation(json.data.explanation);
        setExplainDemo(json.demo);
      }
    },
    [explainRequest]
  );

  return {
    aiExplanation,
    explainDemo,
    ideas,
    ideasDemo,
    explainLoading: explainRequest.loading,
    ideasLoading: ideasRequest.loading,
    fetchIdeas,
    fetchExplanation,
    setAiExplanation,
    setExplainDemo,
  };
}
