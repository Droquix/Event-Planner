'use client';

import React from 'react';
import type { TabId } from '../types/plan';
import { SparklesIcon } from './icons';

export interface AppNavbarProps {
  active: TabId;
  tabs: readonly { id: TabId; label: string }[];
  headerSubtitle: string;
  savedBanner: boolean;
  onSelectTab: (id: TabId) => void;
  onResetAll: () => void;
  onSavePlan: () => void;
}

const flexCenter: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const NavbarBrand: React.FC<{ subtitle: string }> = ({ subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div
      style={{
        ...flexCenter,
        background: '#60a5fa',
        color: '#070d19',
        width: 32,
        height: 32,
        borderRadius: 10,
        flexShrink: 0,
      }}
    >
      <SparklesIcon size={18} color="#070d19" />
    </div>
    <div>
      <h1 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', margin: 0, lineHeight: 1.2 }}>
        Event Planner
      </h1>
      <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0', lineHeight: 1.2 }}>
        {subtitle}
      </p>
    </div>
  </div>
);

interface TabsProps {
  active: TabId;
  tabs: readonly { id: TabId; label: string }[];
  onSelectTab: (id: TabId) => void;
}

function handleTabKey(
  e: React.KeyboardEvent,
  id: TabId,
  tabs: readonly { id: TabId; label: string }[],
  onSelect: (id: TabId) => void
) {
  const ids = tabs.map((t) => t.id);
  const idx = ids.indexOf(id);
  let nextId: TabId | null = null;
  if (e.key === 'ArrowRight') nextId = ids[(idx + 1) % ids.length];
  else if (e.key === 'ArrowLeft') nextId = ids[(idx - 1 + ids.length) % ids.length];
  else if (e.key === 'Home') nextId = ids[0];
  else if (e.key === 'End') nextId = ids[ids.length - 1];

  if (nextId) {
    e.preventDefault();
    onSelect(nextId);
    document.getElementById(`tab-${nextId}`)?.focus();
  }
}

const NavbarTabs: React.FC<TabsProps> = ({ active, tabs, onSelectTab }) => (
  <nav
    role="tablist"
    aria-label="Main sections"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      background: 'rgba(7, 13, 25, 0.6)',
      border: '1px solid rgba(30, 41, 59, 0.7)',
      borderRadius: 9999,
      padding: '3px',
    }}
  >
    {tabs.map(({ id, label }) => {
      const isCurrent = active === id;
      return (
        <button
          key={id}
          role="tab"
          aria-selected={isCurrent}
          aria-controls={`panel-${id}`}
          id={`tab-${id}`}
          tabIndex={isCurrent ? 0 : -1}
          onClick={() => onSelectTab(id)}
          onKeyDown={(e) => handleTabKey(e, id, tabs, onSelectTab)}
          style={{
            ...flexCenter,
            background: isCurrent ? '#1c2a47' : 'transparent',
            border: 'none',
            borderRadius: 9999,
            padding: '8px 16px',
            minHeight: 44,
            minWidth: 44,
            color: isCurrent ? '#ffffff' : '#94a3b8',
            fontWeight: isCurrent ? 600 : 500,
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            outline: 'none',
          }}
        >
          {label}
        </button>
      );
    })}
  </nav>
);

interface ActionsProps {
  savedBanner: boolean;
  onResetAll: () => void;
  onSavePlan: () => void;
}

const NavbarActions: React.FC<ActionsProps> = ({ savedBanner, onResetAll, onSavePlan }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <button
      type="button"
      onClick={onResetAll}
      aria-label="Start new plan and clear all data"
      style={{
        ...flexCenter,
        background: 'transparent',
        color: '#94a3b8',
        border: '1px solid #1e293b',
        borderRadius: 10,
        padding: '10px 16px',
        minHeight: 44,
        fontSize: 12,
        fontWeight: 600,
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
      Start new plan
    </button>
    <button
      type="button"
      onClick={onSavePlan}
      style={{
        ...flexCenter,
        background: '#60a5fa',
        color: '#070d19',
        border: 'none',
        borderRadius: 10,
        padding: '10px 18px',
        minHeight: 44,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#3b82f6')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '#60a5fa')}
    >
      {savedBanner ? '✓ Plan saved!' : 'Save plan'}
    </button>
    <div
      aria-live="polite"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        border: 0,
      }}
    >
      {savedBanner ? 'Plan saved successfully' : ''}
    </div>
  </div>
);

/**
 * Top floating navigation header with breadcrumbs, tab selection, and plan lifecycle actions.
 */
export const AppNavbar: React.FC<AppNavbarProps> = ({
  active,
  tabs,
  headerSubtitle,
  savedBanner,
  onSelectTab,
  onResetAll,
  onSavePlan,
}) => {
  return (
    <header
      style={{
        background: '#0d1527',
        border: '1px solid #182235',
        borderRadius: 16,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      }}
    >
      <NavbarBrand subtitle={headerSubtitle} />
      <NavbarTabs active={active} tabs={tabs} onSelectTab={onSelectTab} />
      <NavbarActions savedBanner={savedBanner} onResetAll={onResetAll} onSavePlan={onSavePlan} />
    </header>
  );
};
