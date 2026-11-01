import React, { useState, useEffect, useRef } from 'react';
import { createBudgetPlan, recalculate, BudgetPlan, BudgetDifference } from '../lib/budget';
import { Card, WarningList, LiveRegion } from './ui';
import { DownloadIcon } from './icons';
import { EventSetup } from '../types/plan';
import { useAbortableRequest } from '../hooks/useAbortableRequest';
import { IdeaItem, DEFAULT_IDEAS, formatInr } from './budget/types';
import { BudgetSlidersCard } from './budget/BudgetSlidersCard';
import { BudgetBreakdownTable } from './budget/BudgetBreakdownTable';
import { BudgetTradeoffCard } from './budget/BudgetTradeoffCard';
import { BudgetIdeasGrid } from './budget/BudgetIdeasGrid';

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

  // Build initial plan from setup
  useEffect(() => {
    setError('');
    setDifferences([]);
    setAiExplanation('');
    setExplainDemo(undefined);

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
        priorities: setup.priorities?.length ? setup.priorities : ['food', 'photography'],
      });
      setPlan(p);
      setGuests(String(g));
      setBudget(String(b));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create plan');
    }
  }, [setup]);

  async function fetchExplanation(diffs: BudgetDifference[]) {
    if (!diffs.length) return;
    const res = await explainRequest.execute({ differences: diffs });
    if (res?.data?.explanation) {
      setAiExplanation(res.data.explanation);
      setExplainDemo(res.demo);
    }
  }

  async function fetchIdeas() {
    if (!plan) return;
    const res = await ideasRequest.execute({
      occasion: setup.occasion || 'wedding',
      city: setup.city || 'Mumbai',
      guestCount: plan.guestCount,
      surplus: plan.surplus ?? 0,
      priorities: setup.priorities?.length ? setup.priorities : ['food', 'photography'],
    });

    if (res?.data?.ideas && Array.isArray(res.data.ideas) && res.data.ideas.length > 0) {
      setIdeas(res.data.ideas);
      setIdeasDemo(res.demo);
    }
  }

  function handleRecalculate() {
    if (!plan) return;
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
    if (b > 1000000000) {
      setError('Budget exceeds maximum limit of ₹100 Crore.');
      return;
    }
    setError('');
    try {
      const result = recalculate(plan, {
        guestCount: g !== plan.guestCount ? g : undefined,
        totalBudget: b !== plan.totalBudget ? b : undefined,
      });
      setPlan(result.plan);
      setDifferences(result.differences);

      const changed = result.differences
        .map((d) => `${d.category}: ${formatInr(d.oldAmount)} → ${formatInr(d.newAmount)}`)
        .join('; ');
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
    return (
      <div style={{ padding: '20px 0' }}>
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ maxWidth: 440, margin: '0 auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>
              No budget plan configured
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
              Complete the event details in Onboarding with your target budget and guest count to
              generate an intelligent allocation breakdown.
            </p>
            {onGoToOnboarding && (
              <button
                type="button"
                onClick={onGoToOnboarding}
                style={{
                  background: '#60a5fa',
                  color: '#070d19',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Go to Onboarding →
              </button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const occasionText = setup.occasion || 'wedding';
  const cityText = setup.city || 'Mumbai';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <LiveRegion message={announcement} />

      {/* Top Left-Aligned Hero Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#38bdf8',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            FINANCIAL CLARITY
          </p>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            A budget that makes room for the memorable.
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, margin: 0 }}>
            Your ₹{Number(plan.totalBudget).toLocaleString('en-IN')} {occasionText} plan, organized
            around the choices that matter most.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPlan}
          style={{
            background: '#131c31',
            border: '1px solid #1e293b',
            borderRadius: 8,
            padding: '8px 14px',
            color: '#cbd5e1',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#131c31')}
        >
          <DownloadIcon size={14} color="#94a3b8" />
          <span>Export plan</span>
        </button>
      </div>

      {/* Card 1: Adjust budget & guests */}
      <BudgetSlidersCard
        guests={guests}
        budget={budget}
        error={error}
        onGuestsChange={setGuests}
        onBudgetChange={setBudget}
        onRecalculate={handleRecalculate}
      />

      {/* Warnings */}
      {plan.warnings && <WarningList warnings={plan.warnings} />}

      {/* Card 2: Budget breakdown table */}
      <BudgetBreakdownTable plan={plan} />

      {/* Differences & AI Tradeoff Explanation Card (if changes occur) */}
      <div ref={diffRef}>
        <BudgetTradeoffCard
          differences={differences}
          aiExplanation={aiExplanation}
          explainLoading={explainRequest.loading}
          explainDemo={explainDemo}
        />
      </div>

      {/* Card 3: AI Personalized Ideas */}
      <BudgetIdeasGrid
        ideas={ideas}
        ideasLoading={ideasRequest.loading}
        ideasDemo={ideasDemo}
        occasionText={occasionText}
        cityText={cityText}
        onRefreshIdeas={fetchIdeas}
      />
    </div>
  );
}
