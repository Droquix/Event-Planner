import React, { useState } from 'react';
import { WarningList } from './ui';
import { EventSetup } from '../types/plan';
import { useAbortableRequest } from '../hooks/useAbortableRequest';
import { OnboardingBriefCard } from './onboarding/OnboardingBriefCard';
import { OnboardingDetailsCard } from './onboarding/OnboardingDetailsCard';
import { OnboardingPrioritiesCard } from './onboarding/OnboardingPrioritiesCard';

interface Props {
  setup: EventSetup;
  onSetupChange: (s: EventSetup) => void;
  onReady: () => void;
}

export default function OnboardingTab({ setup, onSetupChange, onReady }: Props) {
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState('');
  const [aiDemo, setAiDemo] = useState<boolean | undefined>(undefined);

  const parseRequest = useAbortableRequest<
    { text: string },
    { data?: Record<string, unknown>; error?: string; demo?: boolean }
  >(async (payload, signal) => {
    const res = await fetch('/api/parse-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: payload.text }),
      signal,
    });
    return res.json();
  });

  function set(field: keyof EventSetup, value: EventSetup[keyof EventSetup]) {
    onSetupChange({ ...setup, [field]: value });
  }

  function togglePriority(val: string) {
    const cur = setup.priorities;
    if (cur.includes(val)) {
      set(
        'priorities',
        cur.filter((p) => p !== val)
      );
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

    setParseError('');
    const json = await parseRequest.execute({ text: trimmed });
    if (!json) return;

    if (json.error) {
      setParseError(json.error);
      return;
    }

    const data = (json.data || json) as Record<string, unknown>;
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
      occasion:
        typeof data.occasion === 'string' && data.occasion.trim()
          ? data.occasion.trim().toLowerCase()
          : setup.occasion,
      date: typeof data.date === 'string' && data.date.trim() ? data.date.trim() : setup.date,
      budget: parsedBudget,
      guestCount: parsedGuests,
      city: typeof data.city === 'string' && data.city.trim() ? data.city.trim() : setup.city,
      priorities:
        Array.isArray(data.priorities) && data.priorities.length
          ? (data.priorities as string[])
          : setup.priorities,
    });
  }

  const canProceed =
    setup.occasion.trim() !== '' &&
    setup.date.trim() !== '' &&
    Number(setup.budget) > 0 &&
    Number(setup.guestCount) >= 1;

  let heroDateText = setup.date ? setup.date : 'your upcoming date';
  if (setup.date) {
    try {
      const d = new Date(setup.date);
      if (!isNaN(d.getTime())) {
        heroDateText = d.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
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
          Shape the {occasionTitle} you want,
          <br />
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
          Start with your event brief. We&apos;ll use it to organize your budget, vendors, and every
          decision leading up to {heroDateText}.
        </p>
      </div>

      {/* Describe your event brief card */}
      <OnboardingBriefCard
        text={text}
        parsing={parseRequest.loading}
        parseError={parseError}
        aiDemo={aiDemo}
        onTextChange={setText}
        onParse={handleParse}
        onLoadSample={handleLoadSample}
      />

      {/* Event details card */}
      <OnboardingDetailsCard setup={setup} onFieldChange={set} />

      {/* Priorities card */}
      <OnboardingPrioritiesCard priorities={setup.priorities} onTogglePriority={togglePriority} />

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
