'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  createBudgetPlan,
  recalculate,
  ALL_CATEGORIES,
  type BudgetPlan,
  type BudgetDifference,
  type BudgetCategory,
} from '../lib/budget';
import {
  Card, WarningList, LiveRegion, fmt, AIBadge,
} from './ui';
import { SlidersIcon, DownloadIcon, DotsIcon } from './icons';
import type { EventSetup } from './OnboardingTab';

interface Props {
  setup: EventSetup;
  onGoToOnboarding?: () => void;
}

interface IdeaItem {
  title: string;
  whyItFits: string;
  costRange: string;
}

const DEFAULT_IDEAS: IdeaItem[] = [
  {
    title: 'Live Regional Food Station',
    whyItFits: 'Elevates catering with interactive culinary engagement for your guests.',
    costRange: '₹15,000 – ₹35,000',
  },
  {
    title: 'Drone Aerial Highlights & Teaser Video',
    whyItFits: 'Enhances photography priority with cinematic outdoor venue perspectives.',
    costRange: '₹20,000 – ₹40,000',
  },
  {
    title: 'Bespoke Floral Photo-Op Backdrop',
    whyItFits: 'Creates a striking focal point for guest portraits while optimizing decor spend.',
    costRange: '₹18,000 – ₹30,000',
  },
  {
    title: 'Acoustic Welcome Duo',
    whyItFits: 'Sets an inviting ambience during guest arrivals without overpowering conversation.',
    costRange: '₹12,000 – ₹25,000',
  },
  {
    title: 'Personalized Guest Welcome Hampers',
    whyItFits: 'Adds a warm hospitality touch with locally sourced treats tailored to your city.',
    costRange: '₹10,000 – ₹22,000',
  },
];

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
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainDemo, setExplainDemo] = useState<boolean | undefined>(undefined);
  const explainAbortRef = useRef<AbortController | null>(null);
  const explainReqIdRef = useRef(0);

  // AI ideas state
  const [ideas, setIdeas] = useState<IdeaItem[]>(DEFAULT_IDEAS);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasDemo, setIdeasDemo] = useState<boolean | undefined>(true);
  const ideasAbortRef = useRef<AbortController | null>(null);
  const ideasReqIdRef = useRef(0);

  useEffect(() => {
    return () => {
      // Abort in-flight requests when tab is unmounted or switched
      explainAbortRef.current?.abort();
      ideasAbortRef.current?.abort();
    };
  }, []);

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

    explainAbortRef.current?.abort();
    const controller = new AbortController();
    explainAbortRef.current = controller;

    const currentReqId = ++explainReqIdRef.current;
    setExplainLoading(true);

    try {
      const res = await fetch('/api/explain-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ differences: diffs }),
        signal: controller.signal,
      });

      if (currentReqId !== explainReqIdRef.current) return;

      const json = await res.json();
      if (json.data?.explanation) {
        setAiExplanation(json.data.explanation);
        setExplainDemo(json.demo);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally {
      if (currentReqId === explainReqIdRef.current) {
        setExplainLoading(false);
      }
    }
  }

  async function fetchIdeas() {
    if (!plan) return;

    ideasAbortRef.current?.abort();
    const controller = new AbortController();
    ideasAbortRef.current = controller;

    const currentReqId = ++ideasReqIdRef.current;
    setIdeasLoading(true);

    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion: setup.occasion || 'event',
          city: setup.city || 'local area',
          priorities: setup.priorities,
          guestCount: plan.guestCount,
          surplus: plan.surplus ?? 0,
        }),
        signal: controller.signal,
      });

      if (currentReqId !== ideasReqIdRef.current) return;

      const json = await res.json();
      if (Array.isArray(json.data?.ideas)) {
        setIdeas(json.data.ideas);
        setIdeasDemo(json.demo);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally {
      if (currentReqId === ideasReqIdRef.current) {
        setIdeasLoading(false);
      }
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

      // Announcement
      const changed = result.differences
        .map((d) => `${d.category}: ${fmt(d.oldAmount)} → ${fmt(d.newAmount)}`)
        .join('; ');
      setAnnouncement(`Budget updated. Changes: ${changed || 'none'}.`);

      if (result.differences.length > 0) {
        fetchExplanation(result.differences);
      } else {
        setAiExplanation('');
        setExplainDemo(undefined);
      }

      setTimeout(() => diffRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recalculation failed');
    }
  }

  function handleExportPlan() {
    if (!plan) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plan, null, 2));
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
              Complete the event details in Onboarding with your target budget and guest count to generate an intelligent allocation breakdown.
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

  const surplus = plan.surplus ?? 0;
  const occasionText = setup.occasion || 'wedding';
  const cityText = setup.city || 'Mumbai';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <LiveRegion message={announcement} />

      {/* Top Left-Aligned Hero Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
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
            Your ₹{Number(plan.totalBudget).toLocaleString('en-IN')} {occasionText} plan, organized around the choices that matter most.
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
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div
            style={{
              background: '#172339',
              color: '#38bdf8',
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SlidersIcon size={16} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Adjust budget &amp; guests
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
              Keep your recommendation set in sync.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 220px' }}>
            <label htmlFor="adj-guests" style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1' }}>
              Guest count
            </label>
            <input
              id="adj-guests"
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              style={{
                background: '#070d19',
                border: '1px solid #1e293b',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#f8fafc',
                fontSize: 13,
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
              onBlur={(e)  => (e.target.style.borderColor = '#1e293b')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 280px' }}>
            <label htmlFor="adj-budget" style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1' }}>
              Total budget (₹)
            </label>
            <input
              id="adj-budget"
              type="number"
              min={1}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={{
                background: '#070d19',
                border: '1px solid #1e293b',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#f8fafc',
                fontSize: 13,
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
              onBlur={(e)  => (e.target.style.borderColor = '#1e293b')}
            />
          </div>

          <button
            type="button"
            onClick={handleRecalculate}
            style={{
              background: '#60a5fa',
              color: '#070d19',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              height: 40,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#3b82f6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#60a5fa')}
          >
            Recalculate
          </button>
        </div>

        {error && <p role="alert" style={{ color: '#fca5a5', fontSize: 12, marginTop: 10 }}>{error}</p>}
      </Card>

      {/* Warnings */}
      {plan.warnings && <WarningList warnings={plan.warnings} />}

      {/* Card 2: Budget breakdown table */}
      <Card style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Budget breakdown — ₹{Number(plan.totalBudget).toLocaleString('en-IN')} · {plan.guestCount} guests
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
              A balanced baseline, ready for your input.
            </p>
          </div>
          <div style={{ color: '#64748b', cursor: 'pointer', padding: 4 }}>
            <DotsIcon size={16} color="#64748b" />
          </div>
        </div>

        <table
          role="table"
          aria-label="Budget allocation by category"
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
        >
          <thead>
            <tr>
              {['CATEGORY', 'AMOUNT', 'SHARE', 'PRICING TYPE', 'PER-GUEST COST'].map((h) => (
                <th
                  key={h}
                  scope="col"
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: 11,
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #182235',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_CATEGORIES.map((cat) => {
              const alloc = plan.allocations[cat];
              const catTitle = cat.charAt(0).toUpperCase() + cat.slice(1);
              const pricingTypeFormatted = alloc.costType === 'per-guest' ? 'Per-guest' : 'Fixed';
              const perGuestFormatted = alloc.perGuestAmount
                ? `₹${alloc.perGuestAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—';

              return (
                <tr
                  key={cat}
                  style={{ borderBottom: '1px solid #141f33' }}
                >
                  <td style={{ padding: '13px 14px', fontWeight: 500, color: '#f8fafc' }}>
                    {catTitle}
                  </td>
                  <td style={{ padding: '13px 14px', color: '#38bdf8', fontWeight: 700 }}>
                    ₹{alloc.amount.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        role="progressbar"
                        aria-valuenow={alloc.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${cat} share ${alloc.percentage}%`}
                        style={{
                          width: 48,
                          height: 5,
                          background: '#1e293b',
                          borderRadius: 9999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${alloc.percentage}%`,
                            height: '100%',
                            background: '#60a5fa',
                            borderRadius: 9999,
                          }}
                        />
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>
                        {alloc.percentage}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 14px', color: '#94a3b8' }}>
                    {pricingTypeFormatted}
                  </td>
                  <td style={{ padding: '13px 14px', color: '#94a3b8' }}>
                    {perGuestFormatted}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {surplus > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid #1e293b' }}>
                <td colSpan={5} style={{ padding: '12px 14px' }}>
                  <span style={{ color: '#86efac', fontWeight: 700 }}>
                    💰 Surplus reserve: {fmt(surplus)}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </Card>

      {/* Differences & AI Tradeoff Explanation Card (if changes occur) */}
      {differences.length > 0 && (
        <div ref={diffRef}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                What changed and why
              </h3>
              <AIBadge demo={explainDemo} loading={explainLoading} />
            </div>

            {(explainLoading || aiExplanation) && (
              <div
                style={{
                  background: '#070d19',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  padding: '14px 16px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                    AI Tradeoff Explanation
                  </span>
                  <AIBadge demo={explainDemo} loading={explainLoading} />
                </div>
                {explainLoading ? (
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>
                    Analyzing recalculation impact with AI...
                  </p>
                ) : (
                  <p style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                    {aiExplanation}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {differences.map((d, i) => (
                <div
                  key={i}
                  style={{
                    background: '#070d19',
                    border: '1px solid #182235',
                    borderRadius: 8,
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>
                      {d.category === 'surplus' ? '💰 Surplus' : d.category}
                    </span>
                    <span style={{ fontSize: 12 }}>
                      <span style={{ color: '#f87171' }}>{fmt(d.oldAmount)}</span>
                      {' → '}
                      <span style={{ color: '#86efac' }}>{fmt(d.newAmount)}</span>
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, margin: 0 }}>{d.reason}</p>
                  {d.suggestedUse && (
                    <p style={{ fontSize: 11, color: '#fbbf24', marginTop: 4, margin: 0 }}>
                      💡 Suggestion: {d.suggestedUse}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Card 3: AI Personalized Ideas */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                margin: 0,
                marginBottom: 4,
              }}
            >
              AI PERSONALIZED IDEAS
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Small upgrades, tailored to {cityText}.
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
              Creative enhancements for this {occasionText}&apos;s priorities.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AIBadge demo={ideasDemo} loading={ideasLoading} />
            <button
              type="button"
              onClick={fetchIdeas}
              disabled={ideasLoading}
              style={{
                background: '#60a5fa',
                color: '#070d19',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: ideasLoading ? 'not-allowed' : 'pointer',
                opacity: ideasLoading ? 0.5 : 1,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#3b82f6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#60a5fa')}
            >
              {ideasLoading ? 'Generating...' : 'Refresh Ideas'}
            </button>
          </div>
        </div>

        {ideasLoading && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#93c5fd', fontSize: 13 }}>
            ⏳ Consulting AI model for personalized event ideas...
          </div>
        )}

        {!ideasLoading && ideas.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {ideas.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#070d19',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8' }}>
                    {item.costRange}
                  </span>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginTop: 4, marginBottom: 6 }}>
                    {idx + 1}. {item.title}
                  </h4>
                  <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                    {item.whyItFits}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
}
