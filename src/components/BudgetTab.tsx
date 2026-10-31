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
  Btn, Card, SectionHeading, WarningList, LiveRegion, fmt, AIBadge,
} from './ui';
import type { EventSetup } from './OnboardingTab';

interface Props {
  setup: EventSetup;
}

const CATEGORY_ICONS: Record<BudgetCategory, string> = {
  venue:         '🏛️',
  catering:      '🍽️',
  decor:         '🌸',
  photography:   '📷',
  entertainment: '🎵',
  misc:          '📦',
};

interface IdeaItem {
  title: string;
  whyItFits: string;
  costRange: string;
}

export default function BudgetTab({ setup }: Props) {
  const [plan, setPlan] = useState<BudgetPlan | null>(null);
  const [error, setError] = useState('');
  const [guests, setGuests] = useState(setup.guestCount);
  const [budget, setBudget] = useState(setup.budget);
  const [differences, setDifferences] = useState<BudgetDifference[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const diffRef = useRef<HTMLDivElement>(null);

  // AI explanation state
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainDemo, setExplainDemo] = useState<boolean | undefined>(undefined);

  // AI ideas state
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasDemo, setIdeasDemo] = useState<boolean | undefined>(undefined);

  // Build initial plan from setup
  useEffect(() => {
    setError('');
    setDifferences([]);
    setAiExplanation('');
    setExplainDemo(undefined);
    const g = Number(setup.guestCount);
    const b = Number(setup.budget);
    if (!g || !b) return;
    try {
      const p = createBudgetPlan({
        totalBudget: b,
        guestCount: g,
        occasion: setup.occasion,
        priorities: setup.priorities,
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
    setExplainLoading(true);
    try {
      const res = await fetch('/api/explain-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ differences: diffs }),
      });
      const json = await res.json();
      if (json.data?.explanation) {
        setAiExplanation(json.data.explanation);
        setExplainDemo(json.demo);
      }
    } catch {
      // Gracefully ignore explanation failure
    } finally {
      setExplainLoading(false);
    }
  }

  async function fetchIdeas() {
    if (!plan) return;
    setIdeasLoading(true);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion: setup.occasion,
          city: setup.city,
          priorities: setup.priorities,
          guestCount: plan.guestCount,
          surplus: plan.surplus ?? 0,
        }),
      });
      const json = await res.json();
      if (Array.isArray(json.data?.ideas)) {
        setIdeas(json.data.ideas);
        setIdeasDemo(json.demo);
      }
    } catch {
      // Gracefully ignore failure
    } finally {
      setIdeasLoading(false);
    }
  }

  function handleRecalculate() {
    if (!plan) return;
    const g = Number(guests);
    const b = Number(budget);
    if (!g || !b) { setError('Guest count and budget must be positive numbers.'); return; }
    setError('');
    try {
      const result = recalculate(plan, {
        guestCount: g !== plan.guestCount ? g : undefined,
        totalBudget: b !== plan.totalBudget ? b : undefined,
      });
      setPlan(result.plan);
      setDifferences(result.differences);

      // Build aria-live announcement
      const changed = result.differences.map((d) =>
        `${d.category}: ${fmt(d.oldAmount)} → ${fmt(d.newAmount)}`
      ).join('; ');
      setAnnouncement(`Budget updated. Changes: ${changed || 'none'}.`);

      // Trigger AI explanation of tradeoff differences
      if (result.differences.length > 0) {
        fetchExplanation(result.differences);
      } else {
        setAiExplanation('');
        setExplainDemo(undefined);
      }

      // Scroll diff section into view
      setTimeout(() => diffRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recalculation failed');
    }
  }

  if (!plan) {
    return (
      <div style={{ color: '#94a3b8', padding: 20, textAlign: 'center' }}>
        {error
          ? <p role="alert" style={{ color: '#fca5a5' }}>{error}</p>
          : <p>Complete the Onboarding tab first to see your budget breakdown.</p>
        }
      </div>
    );
  }

  const surplus = plan.surplus ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <LiveRegion message={announcement} />

      {/* Controls */}
      <Card>
        <SectionHeading>Adjust budget & guests</SectionHeading>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 180px' }}>
            <label htmlFor="adj-guests" style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>
              Guest count
            </label>
            <input
              id="adj-guests"
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              style={{
                background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
                padding: '8px 12px', color: '#f8fafc', fontSize: 14, outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
              onBlur={(e)  => (e.target.style.borderColor = '#334155')}
              aria-label="New guest count"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 220px' }}>
            <label htmlFor="adj-budget" style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>
              Total budget (₹)
            </label>
            <input
              id="adj-budget"
              type="number"
              min={1}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={{
                background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
                padding: '8px 12px', color: '#f8fafc', fontSize: 14, outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
              onBlur={(e)  => (e.target.style.borderColor = '#334155')}
              aria-label="New total budget in rupees"
            />
          </div>
          <Btn onClick={handleRecalculate}>↩ Recalculate</Btn>
        </div>
        {error && <p role="alert" style={{ color: '#fca5a5', fontSize: 13, marginTop: 10 }}>{error}</p>}
      </Card>

      {/* Warnings */}
      {plan.warnings && <WarningList warnings={plan.warnings} />}

      {/* Allocation table */}
      <Card style={{ overflowX: 'auto' }}>
        <SectionHeading>
          Budget breakdown — {fmt(plan.totalBudget)} · {plan.guestCount} guests
        </SectionHeading>
        <table
          role="table"
          aria-label="Budget allocation by category"
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}
        >
          <thead>
            <tr>
              {['Category', 'Amount', 'Share %', 'Pricing type', 'Per-guest cost'].map((h) => (
                <th
                  key={h}
                  scope="col"
                  style={{
                    padding: '8px 12px', textAlign: 'left',
                    color: '#64748b', fontWeight: 600, fontSize: 12,
                    borderBottom: '1px solid #334155',
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
              return (
                <tr
                  key={cat}
                  style={{ borderBottom: '1px solid #1e3a5f' }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#e2e8f0' }}>
                    <span aria-hidden>{CATEGORY_ICONS[cat]} </span>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#7dd3fc', fontWeight: 700 }}>
                    {fmt(alloc.amount)}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        role="progressbar"
                        aria-valuenow={alloc.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${cat} share ${alloc.percentage}%`}
                        style={{
                          width: 60, height: 6, background: '#334155', borderRadius: 4, overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${alloc.percentage}%`, height: '100%',
                            background: '#38bdf8', borderRadius: 4,
                          }}
                        />
                      </div>
                      {alloc.percentage}%
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        background: alloc.costType === 'per-guest' ? '#1a2e44' : '#1c2a3a',
                        color: alloc.costType === 'per-guest' ? '#93c5fd' : '#a5f3fc',
                        padding: '2px 8px', borderRadius: 12, fontSize: 12,
                      }}
                    >
                      {alloc.costType}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                    {alloc.perGuestAmount ? fmt(alloc.perGuestAmount) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {surplus > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid #334155' }}>
                <td colSpan={5} style={{ padding: '10px 12px' }}>
                  <span style={{ color: '#86efac', fontWeight: 700 }}>
                    💰 Surplus: {fmt(surplus)}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </Card>

      {/* Differences & AI Tradeoff Explanation */}
      {differences.length > 0 && (
        <div ref={diffRef}><Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              What changed and why
            </h2>
            <AIBadge demo={explainDemo} loading={explainLoading} />
          </div>

          {/* AI Explanation banner */}
          {(explainLoading || aiExplanation) && (
            <div
              style={{
                background: '#09233f',
                border: '1px solid #1e4b7a',
                borderRadius: 8,
                padding: '14px 16px',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#7dd3fc' }}>
                  🤖 AI Tradeoff Explanation
                </span>
                <AIBadge demo={explainDemo} loading={explainLoading} />
              </div>
              {explainLoading ? (
                <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
                  Analyzing recalculation impact with AI...
                </p>
              ) : (
                <p style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  {aiExplanation}
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {differences.map((d, i) => (
              <div
                key={i}
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e3a5f',
                  borderRadius: 8,
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: '#e2e8f0', textTransform: 'capitalize' }}>
                    {d.category === 'surplus' ? '💰 Surplus' : `${CATEGORY_ICONS[d.category as BudgetCategory] ?? ''} ${d.category}`}
                  </span>
                  <span style={{ fontSize: 13 }}>
                    <span style={{ color: '#f87171' }}>{fmt(d.oldAmount)}</span>
                    {' → '}
                    <span style={{ color: '#86efac' }}>{fmt(d.newAmount)}</span>
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>{d.reason}</p>
                {d.suggestedUse && (
                  <p style={{ fontSize: 12, color: '#fbbf24', marginTop: 4 }}>
                    💡 Suggestion: {d.suggestedUse}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card></div>
      )}

      {/* Ideas Panel */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              💡 AI Personalized Ideas
            </h2>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Creative enhancements tailored for {setup.occasion || 'your event'} in {setup.city || 'your city'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AIBadge demo={ideasDemo} loading={ideasLoading} />
            <Btn onClick={fetchIdeas} disabled={ideasLoading} size="sm">
              {ideasLoading ? '⏳ Generating...' : ideas.length ? '🔄 Refresh Ideas' : '✨ Get 5 Ideas'}
            </Btn>
          </div>
        </div>

        {ideasLoading && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#93c5fd', fontSize: 13 }}>
            ⏳ Consulting AI model for personalized event ideas...
          </div>
        )}

        {!ideasLoading && ideas.length === 0 && (
          <div style={{ padding: '16px 0', color: '#64748b', fontSize: 13, textAlign: 'center' }}>
            Click &quot;Get 5 Ideas&quot; to generate budget-aligned ideas and special touches for your event.
          </div>
        )}

        {!ideasLoading && ideas.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {ideas.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#f8fafc' }}>
                    {idx + 1}. {item.title}
                  </span>
                  <span
                    style={{
                      background: '#14532d',
                      color: '#86efac',
                      borderRadius: 12,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.costRange}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                  {item.whyItFits}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
