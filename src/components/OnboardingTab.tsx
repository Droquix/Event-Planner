import React from 'react';
import { WarningList } from './ui';
import type { EventSetup } from '../types/plan';
import { OnboardingBriefCard } from './onboarding/OnboardingBriefCard';
import { OnboardingDetailsCard } from './onboarding/OnboardingDetailsCard';
import { OnboardingPrioritiesCard } from './onboarding/OnboardingPrioritiesCard';
import { OnboardingHero } from './onboarding/OnboardingHero';
import { useOnboarding } from './onboarding/useOnboarding';

interface Props {
  setup: EventSetup;
  onSetupChange: (s: EventSetup) => void;
  onReady: () => void;
}

function getMissingWarnings(setup: EventSetup): string[] {
  const warnings: string[] = [];
  if (!setup.occasion) warnings.push('Please select an occasion.');
  if (!setup.date) warnings.push('Please enter the event date.');
  if (!(Number(setup.budget) > 0)) warnings.push('Please enter a valid total budget.');
  if (!(Number(setup.guestCount) >= 1)) warnings.push('Please enter the number of guests.');
  return warnings;
}

export default function OnboardingTab({ setup, onSetupChange, onReady }: Props) {
  const {
    text,
    setText,
    parseError,
    aiDemo,
    parsing,
    setField,
    togglePriority,
    handleLoadSample,
    handleParse,
  } = useOnboarding(setup, onSetupChange);

  const missingWarnings = getMissingWarnings(setup);
  const canProceed = missingWarnings.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <OnboardingHero occasion={setup.occasion} date={setup.date} />

      <OnboardingBriefCard
        text={text}
        parsing={parsing}
        parseError={parseError}
        aiDemo={aiDemo}
        onTextChange={setText}
        onParse={handleParse}
        onLoadSample={handleLoadSample}
      />

      <OnboardingDetailsCard setup={setup} onFieldChange={setField} />

      <OnboardingPrioritiesCard priorities={setup.priorities} onTogglePriority={togglePriority} />

      {!canProceed && <WarningList warnings={missingWarnings} />}

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
