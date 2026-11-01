'use client';

import React from 'react';
import { WarningList, LiveRegion } from './ui';
import type { EventSetup } from '../types/plan';
import { BudgetSlidersCard } from './budget/BudgetSlidersCard';
import { BudgetBreakdownTable } from './budget/BudgetBreakdownTable';
import { BudgetTradeoffCard } from './budget/BudgetTradeoffCard';
import { BudgetIdeasGrid } from './budget/BudgetIdeasGrid';
import { BudgetEmptyCard } from './budget/BudgetEmptyCard';
import { BudgetHeader } from './budget/BudgetHeader';
import { useBudgetPlanner } from './budget/useBudgetPlanner';

interface Props {
  setup: EventSetup;
  onGoToOnboarding?: () => void;
}

export default function BudgetTab({ setup, onGoToOnboarding }: Props) {
  const {
    plan,
    error,
    guests,
    budget,
    differences,
    announcement,
    diffRef,
    aiExplanation,
    explainDemo,
    ideas,
    ideasDemo,
    explainLoading,
    ideasLoading,
    setGuests,
    setBudget,
    handleRecalculate,
    handleExportPlan,
    fetchIdeas,
  } = useBudgetPlanner(setup);

  if (!plan) {
    return <BudgetEmptyCard onGoToOnboarding={onGoToOnboarding} />;
  }

  const occasionText = setup.occasion || 'wedding';
  const cityText = setup.city || 'Mumbai';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <LiveRegion message={announcement} />

      <BudgetHeader occasionText={occasionText} cityText={cityText} onExport={handleExportPlan} />

      <BudgetSlidersCard
        guests={guests}
        budget={budget}
        error={error}
        onGuestsChange={setGuests}
        onBudgetChange={setBudget}
        onRecalculate={handleRecalculate}
      />

      <div ref={diffRef}>
        <BudgetTradeoffCard
          differences={differences}
          aiExplanation={aiExplanation}
          explainLoading={explainLoading}
          explainDemo={explainDemo}
        />
      </div>

      <BudgetBreakdownTable plan={plan} />

      {(plan.warnings?.length ?? 0) > 0 && <WarningList warnings={plan.warnings ?? []} />}

      <BudgetIdeasGrid
        ideas={ideas}
        ideasLoading={ideasLoading}
        ideasDemo={ideasDemo}
        occasionText={occasionText}
        cityText={cityText}
        onRefreshIdeas={() => void fetchIdeas(plan)}
      />
    </div>
  );
}
