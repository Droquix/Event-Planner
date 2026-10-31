'use client';

import React, { useState } from 'react';
import { Field, SelectField, Btn, Card, SectionHeading, WarningList, AIBadge } from './ui';

export interface EventSetup {
  occasion: string;
  date: string;
  budget: string;
  guestCount: string;
  city: string;
  priorities: string[];
}

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

  async function handleParse() {
    if (!text.trim()) return;
    setParsing(true);
    setParseError('');
    try {
      const res = await fetch('/api/parse-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (json.error) {
        setParseError(json.error);
        return;
      }
      const data = json.data || json;
      setAiDemo(typeof json.demo === 'boolean' ? json.demo : undefined);
      onSetupChange({
        occasion:   data.occasion   || setup.occasion,
        date:       data.date       || setup.date,
        budget:     data.budget     != null ? String(data.budget) : setup.budget,
        guestCount: data.guestCount != null ? String(data.guestCount) : setup.guestCount,
        city:       data.city       || setup.city,
        priorities: data.priorities?.length ? data.priorities : setup.priorities,
      });
    } catch {
      setParseError('Network error. Please fill in the fields manually.');
    } finally {
      setParsing(false);
    }
  }

  const canProceed =
    setup.occasion.trim() !== '' &&
    setup.date.trim() !== '' &&
    Number(setup.budget) > 0 &&
    Number(setup.guestCount) >= 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Free-text intake */}
      <Card>
        <SectionHeading>Describe your event (optional)</SectionHeading>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
          Type a short description and we&apos;ll try to fill in the fields below automatically.
          You can always edit them.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label htmlFor="intake-text" style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>
            Event description
          </label>
          <textarea
            id="intake-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. We are planning a wedding in Mumbai for around 200 guests on 15 February 2026. Budget is 25 lakhs. Top priorities are food and photography."
            rows={4}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: '10px 12px',
              color: '#f8fafc',
              fontSize: 14,
              resize: 'vertical',
              width: '100%',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
            onBlur={(e)  => (e.target.style.borderColor = '#334155')}
            aria-describedby="intake-help"
          />
          <span id="intake-help" style={{ fontSize: 11, color: '#64748b' }}>
            Mention date (e.g. 15 November 2026), budget (e.g. 10 lakh), guest count, and city.
          </span>
          {parseError && (
            <p role="alert" style={{ color: '#fca5a5', fontSize: 13 }}>
              {parseError}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Btn onClick={handleParse} disabled={parsing || !text.trim()}>
              {parsing ? '⏳ Analyzing with AI…' : '✨ Auto-fill fields'}
            </Btn>
            <AIBadge demo={aiDemo} loading={parsing} />
          </div>
        </div>
      </Card>

      {/* Structured fields */}
      <Card>
        <SectionHeading>Event details</SectionHeading>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
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
            helpText="YYYY-MM-DD"
          />

          <Field
            id="total-budget"
            label="Total budget (₹) *"
            type="number"
            min={1}
            value={setup.budget}
            onChange={(e) => set('budget', e.target.value)}
            placeholder="e.g. 1500000"
            required
            helpText="Enter total amount in rupees"
          />

          <Field
            id="guest-count"
            label="Number of guests *"
            type="number"
            min={1}
            value={setup.guestCount}
            onChange={(e) => set('guestCount', e.target.value)}
            placeholder="e.g. 150"
            required
          />

          <Field
            id="city"
            label="City"
            type="text"
            value={setup.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="e.g. Mumbai"
          />
        </div>
      </Card>

      {/* Priorities */}
      <Card>
        <SectionHeading>Priorities (pick up to 3)</SectionHeading>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>
          Selected categories will receive a larger share of the budget.
        </p>
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className="sr-only">Budget priorities</legend>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
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
                    background: active ? '#0c4a6e' : '#1e293b',
                    border: active ? '2px solid #38bdf8' : '2px solid #334155',
                    borderRadius: 8,
                    padding: '7px 16px',
                    color: active ? '#e0f2fe' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: active ? 700 : 400,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  {active && (
                    <span
                      aria-label={`Priority ${rank + 1}`}
                      style={{
                        background: '#38bdf8',
                        color: '#0f172a',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {rank + 1}
                    </span>
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <p style={{ fontSize: 11, color: '#64748b', marginTop: 10 }}>
          {setup.priorities.length}/3 selected
        </p>
      </Card>

      {/* Validation hints */}
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

      <div>
        <Btn
          onClick={onReady}
          disabled={!canProceed}
          style={{ padding: '10px 28px', fontSize: 15 }}
          aria-disabled={!canProceed}
        >
          Continue to Budget →
        </Btn>
      </div>
    </div>
  );
}
