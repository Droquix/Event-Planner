'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Field, SelectField, Card, WarningList, AIBadge } from './ui';
import { SparklesIcon, CalendarIcon } from './icons';
import type { EventSetup } from '../types/plan';

export type { EventSetup };

const OCCASIONS = [
  '', 'wedding', 'anniversary', 'birthday', 'party', 'graduation',
  'corporate', 'conference', 'engagement', 'reception', 'baby shower',
  'festival', 'sangeet', 'mehendi', 'puja / pooja',
];

const PRIORITY_OPTIONS = [
  { value: 'food',          label: 'Food / Catering' },
  { value: 'decor',         label: 'Decor' },
  { value: 'photography',   label: 'Photography' },
  { value: 'venue',         label: 'Venue' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'misc',          label: 'Miscellaneous' },
];

interface Props {
  setup: EventSetup;
  onSetupChange: (s: EventSetup) => void;
  onReady: () => void;
}

export default function OnboardingTab({ setup, onSetupChange, onReady }: Props) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [aiDemo, setAiDemo] = useState<boolean | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      // Abort any in-flight request when navigating tabs or unmounting
      abortControllerRef.current?.abort();
    };
  }, []);

  function set(field: keyof EventSetup, value: EventSetup[keyof EventSetup]) {
    onSetupChange({ ...setup, [field]: value });
  }

  function togglePriority(val: string) {
    const cur = setup.priorities;
    if (cur.includes(val)) {
      set('priorities', cur.filter((p) => p !== val));
    } else if (cur.length < 3) {
      set('priorities', [...cur, val]);
    }
  }

  function handleLoadSample() {
    setText(
      'We are planning a wedding in Mumbai for around 200 guests on 15 February 2027. Budget is 25 lakhs. Top priorities are food and photography.'
    );
    setParseError('');
  }

  async function handleParse() {
    const trimmed = text.trim();
    if (!trimmed) {
      setParseError('Please enter an event description before auto-filling.');
      return;
    }

    // Cancel in-flight request if user clicks again
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentReqId = ++requestIdRef.current;
    setParsing(true);
    setParseError('');

    try {
      const res = await fetch('/api/parse-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
        signal: controller.signal,
      });

      // Ignore stale response if a newer request has started
      if (currentReqId !== requestIdRef.current) return;

      const json = await res.json();
      if (json.error) {
        setParseError(json.error);
        return;
      }
      const data = json.data || json;
      setAiDemo(typeof json.demo === 'boolean' ? json.demo : undefined);

      const parsedBudget =
        data.budget != null && !isNaN(Number(data.budget)) && Number(data.budget) > 0
          ? String(data.budget)
          : setup.budget;

      const parsedGuests =
        data.guestCount != null && !isNaN(Number(data.guestCount)) && Number(data.guestCount) >= 1
          ? String(data.guestCount)
          : setup.guestCount;

      onSetupChange({
        occasion:   typeof data.occasion === 'string' && data.occasion.trim() ? data.occasion.trim().toLowerCase() : setup.occasion,
        date:       typeof data.date === 'string' && data.date.trim() ? data.date.trim() : setup.date,
        budget:     parsedBudget,
        guestCount: parsedGuests,
        city:       typeof data.city === 'string' && data.city.trim() ? data.city.trim() : setup.city,
        priorities: Array.isArray(data.priorities) && data.priorities.length ? data.priorities : setup.priorities,
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      if (currentReqId === requestIdRef.current) {
        setParseError('Unable to connect to AI service. Please fill in the fields manually.');
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setParsing(false);
      }
    }
  }

  const canProceed =
    setup.occasion.trim() !== '' &&
    setup.date.trim() !== '' &&
    Number(setup.budget) > 0 &&
    Number(setup.guestCount) >= 1;

  // Format date for display in the hero description
  let heroDateText = setup.date ? setup.date : 'your upcoming date';
  if (setup.date) {
    try {
      const d = new Date(setup.date);
      if (!isNaN(d.getTime())) {
        heroDateText = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch {
      // fallback
    }
  }

  const occasionLabel = setup.occasion ? setup.occasion.toUpperCase() : 'EVENT';
  const occasionTitle = setup.occasion ? setup.occasion : 'event';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Centered Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: 12, paddingTop: 8 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          YOUR {occasionLabel}, CLEARLY PLANNED
        </p>
        <h2
          style={{
            fontSize: 38,
            fontWeight: 600,
            color: '#ffffff',
            lineHeight: 1.18,
            letterSpacing: '-0.02em',
            marginBottom: 14,
          }}
        >
          Shape the {occasionTitle} you want,<br />
          then let the details fall into place.
        </h2>
        <p
          style={{
            fontSize: 14,
            color: '#94a3b8',
            maxWidth: 620,
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Start with your event brief. We&apos;ll use it to organize your budget, vendors, and every decision leading up to {heroDateText}.
        </p>
      </div>

      {/* Card 1: Describe your event */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              Describe your event (optional)
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
              Share the outline and we&apos;ll prefill the details below.
            </p>
          </div>
          <div style={{ color: '#60a5fa', opacity: 0.85, padding: 4 }}>
            <SparklesIcon size={18} color="#60a5fa" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="intake-text" style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
            Event description
          </label>
          <textarea
            id="intake-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. We are planning a wedding in Mumbai for around 200 guests on 15 February 2027. Budget is 25 lakhs. Top priorities are food and photography."
            rows={4}
            style={{
              background: '#070d19',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '12px 14px',
              color: '#f8fafc',
              fontSize: 13,
              resize: 'vertical',
              width: '100%',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
            onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
            onBlur={(e)  => (e.target.style.borderColor = '#1e293b')}
            aria-describedby="intake-help"
          />
          <span id="intake-help" style={{ fontSize: 11, color: '#64748b', marginTop: 6, marginBottom: 14 }}>
            Mention date, budget, guest count, and city. You can always edit the details.
          </span>

          {parseError && (
            <p role="alert" style={{ color: '#fca5a5', fontSize: 12, marginBottom: 12 }}>
              {parseError}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleParse}
              disabled={parsing || !text.trim()}
              style={{
                background: '#60a5fa',
                color: '#070d19',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: 12,
                fontWeight: 700,
                cursor: parsing || !text.trim() ? 'not-allowed' : 'pointer',
                opacity: parsing || !text.trim() ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#3b82f6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#60a5fa')}
            >
              <SparklesIcon size={14} color="#070d19" />
              <span>{parsing ? 'Analyzing with AI…' : 'Auto-fill fields'}</span>
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #1e293b',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f8fafc';
                e.currentTarget.style.borderColor = '#334155';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = '#1e293b';
              }}
            >
              Load sample brief
            </button>
            <AIBadge demo={aiDemo} loading={parsing} />
          </div>
        </div>
      </Card>

      {/* Card 2: Event details */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
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
            <CalendarIcon size={16} color="#38bdf8" />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Event details
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            <SelectField
              id="occasion"
              label="Occasion *"
              value={setup.occasion}
              onChange={(e) => set('occasion', e.target.value)}
              required
            >
              <option value="">Select occasion…</option>
              {OCCASIONS.filter(Boolean).map((o) => (
                <option key={o} value={o}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </option>
              ))}
            </SelectField>

            <Field
              id="event-date"
              label="Event date *"
              type="date"
              value={setup.date}
              onChange={(e) => set('date', e.target.value)}
              required
            />

            <Field
              id="total-budget"
              label="Total budget (₹) *"
              type="number"
              min={1}
              value={setup.budget}
              onChange={(e) => set('budget', e.target.value)}
              placeholder="e.g. 2500000"
              required
            />

            <Field
              id="guest-count"
              label="Number of guests *"
              type="number"
              min={1}
              value={setup.guestCount}
              onChange={(e) => set('guestCount', e.target.value)}
              placeholder="e.g. 200"
              required
            />
          </div>

          <div style={{ maxWidth: 300 }}>
            <Field
              id="city"
              label="City"
              type="text"
              value={setup.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="e.g. Mumbai"
            />
          </div>
        </div>
      </Card>

      {/* Card 3: Priorities (pick up to 3) */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Priorities (pick up to 3)
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
              Selected categories receive a larger share of the budget.
            </p>
          </div>
          <div
            style={{
              background: '#131d33',
              border: '1px solid #1e293b',
              color: '#94a3b8',
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 9999,
            }}
          >
            {setup.priorities.length} / 3 selected
          </div>
        </div>

        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Budget priorities</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {PRIORITY_OPTIONS.map(({ value, label }) => {
              const active = setup.priorities.includes(value);
              const rank = setup.priorities.indexOf(value);
              return (
                <button
                  key={value}
                  type="button"
                  role="checkbox"
                  aria-checked={active}
                  onClick={() => togglePriority(value)}
                  style={{
                    background: active ? '#60a5fa' : '#070d19',
                    border: active ? '1px solid #60a5fa' : '1px solid #1e293b',
                    borderRadius: 8,
                    padding: '7px 16px',
                    color: active ? '#070d19' : '#cbd5e1',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {active && (
                    <span
                      aria-label={`Priority rank ${rank + 1}`}
                      style={{
                        background: '#070d19',
                        color: '#60a5fa',
                        borderRadius: '50%',
                        width: 17,
                        height: 17,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {rank + 1}
                    </span>
                  )}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </Card>

      {/* Validation warning list if required fields missing */}
      {!canProceed && (
        <WarningList
          warnings={[
            ...(!setup.occasion ? ['Please select an occasion.'] : []),
            ...(!setup.date ? ['Please enter the event date.'] : []),
            ...(!(Number(setup.budget) > 0) ? ['Please enter a valid total budget.'] : []),
            ...(!(Number(setup.guestCount) >= 1) ? ['Please enter the number of guests.'] : []),
          ]}
        />
      )}

      {/* Bottom Action: Continue to Budget */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          type="button"
          onClick={onReady}
          disabled={!canProceed}
          aria-disabled={!canProceed}
          style={{
            background: '#60a5fa',
            color: '#070d19',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: 13,
            fontWeight: 700,
            cursor: !canProceed ? 'not-allowed' : 'pointer',
            opacity: !canProceed ? 0.45 : 1,
            transition: 'background 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
          onMouseEnter={(e) => {
            if (canProceed) e.currentTarget.style.background = '#3b82f6';
          }}
          onMouseLeave={(e) => {
            if (canProceed) e.currentTarget.style.background = '#60a5fa';
          }}
        >
          <span>Continue to Budget</span>
          <span aria-hidden>→</span>
        </button>
      </div>

    </div>
  );
}
