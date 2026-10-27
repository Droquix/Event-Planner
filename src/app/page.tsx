'use client';

import React, { useState, useMemo } from 'react';
import {
  createBudgetPlan,
  recalculate,
  ALL_CATEGORIES,
  type BudgetPlan,
  type BudgetDifference,
} from '../lib/budget';
import {
  buildWeddingTimelineWithFeasibility,
  cancelVendorTask,
  type Task,
} from '../lib/timeline';

export default function HomePage() {
  // Budget State
  const [totalBudget, setTotalBudget] = useState<number>(1000000);
  const [guestCount, setGuestCount] = useState<number>(100);
  const [occasion, setOccasion] = useState<string>('wedding');
  const [prioritiesText, setPrioritiesText] = useState<string>('food, photography, decor');

  const [activePlan, setActivePlan] = useState<BudgetPlan>(() => {
    return createBudgetPlan({
      totalBudget: 1000000,
      guestCount: 100,
      occasion: 'wedding',
      priorities: ['food', 'photography', 'decor'],
    });
  });

  const [differences, setDifferences] = useState<BudgetDifference[]>([]);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  // Timeline State
  const [eventDate, setEventDate] = useState<string>('2026-12-31');
  const [todayReference, setTodayReference] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  const initialTimelineResult = useMemo(() => {
    return buildWeddingTimelineWithFeasibility('2026-12-31', undefined, todayReference);
  }, [todayReference]);

  const [tasks, setTasks] = useState<Task[]>(initialTimelineResult.tasks);
  const [timelineWarnings, setTimelineWarnings] = useState<string[]>(
    initialTimelineResult.warnings
  );

  // Handle Budget Plan Creation
  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBudgetError(null);
      const prioList = prioritiesText
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const newPlan = createBudgetPlan({
        totalBudget,
        guestCount,
        occasion,
        priorities: prioList,
      });

      setActivePlan(newPlan);
      setDifferences([]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBudgetError(err.message);
      }
    }
  };

  // Handle Recalculate
  const handleRecalculate = (newBudgetVal?: number, newGuestsVal?: number) => {
    try {
      setBudgetError(null);
      const changes = {
        totalBudget: newBudgetVal ?? totalBudget,
        guestCount: newGuestsVal ?? guestCount,
      };

      const result = recalculate(activePlan, changes);
      setActivePlan(result.plan);
      setDifferences(result.differences);
      if (newBudgetVal !== undefined) setTotalBudget(newBudgetVal);
      if (newGuestsVal !== undefined) setGuestCount(newGuestsVal);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBudgetError(err.message);
      }
    }
  };

  // Handle Timeline Update
  const handleUpdateTimeline = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = buildWeddingTimelineWithFeasibility(eventDate, undefined, todayReference);
      setTasks(res.tasks);
      setTimelineWarnings(res.warnings);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  // Handle Cancel Vendor
  const handleCancelTask = (taskId: string) => {
    try {
      const updated = cancelVendorTask(tasks, taskId);
      setTasks(updated);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Event Planner</h1>
        <p>Intelligent Indian Wedding & Event Budgeting with Dependency-Aware Timelines</p>
      </header>

      <div className="grid-cols-2">
        {/* Left Column: Budget Planner */}
        <section className="card">
          <div className="card-title">
            <span>Budget Engine (INR)</span>
            <span className="badge badge-fixed">
              Total: ₹{activePlan.totalBudget.toLocaleString('en-IN')}
            </span>
          </div>

          {budgetError && <div className="alert alert-warning">{budgetError}</div>}
          {activePlan.warnings?.map((w, i) => (
            <div key={i} className="alert alert-warning">
              {w}
            </div>
          ))}

          <form onSubmit={handleGeneratePlan} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Total Budget (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Guest Count</label>
                <input
                  type="number"
                  className="form-input"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Priorities (comma-separated: food, photography, decor, etc.)</label>
              <input
                type="text"
                className="form-input"
                value={prioritiesText}
                onChange={(e) => setPrioritiesText(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Create / Reset Plan
            </button>
          </form>

          {/* Quick Recalculate Actions */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Quick Recalculation Tests:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn"
                style={{ background: '#334155', color: '#fff', fontSize: '0.8rem' }}
                onClick={() => handleRecalculate(undefined, guestCount + 50)}
              >
                +50 Guests
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#334155', color: '#fff', fontSize: '0.8rem' }}
                onClick={() => handleRecalculate(undefined, Math.max(1, guestCount - 30))}
              >
                -30 Guests (Surplus)
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#334155', color: '#fff', fontSize: '0.8rem' }}
                onClick={() => handleRecalculate(Math.round(totalBudget * 0.7), undefined)}
              >
                -30% Budget Cut
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#334155', color: '#fff', fontSize: '0.8rem' }}
                onClick={() => handleRecalculate(Math.round(totalBudget * 0.1), undefined)}
              >
                -90% Budget Cut
              </button>
            </div>
          </div>

          {/* Surplus Display if Present */}
          {activePlan.surplus !== undefined && activePlan.surplus > 0 && (
            <div className="alert alert-info">
              <strong>Unallocated Surplus:</strong> ₹{activePlan.surplus.toLocaleString('en-IN')}
            </div>
          )}

          {/* Allocations Breakdown */}
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
              Category Allocations (3% Floor Enforced)
            </h3>
            {ALL_CATEGORIES.map((cat) => {
              const alloc = activePlan.allocations[cat];
              return (
                <div key={cat} className="category-row">
                  <div>
                    <span className="category-name">{cat}</span>{' '}
                    <span
                      className={`badge ${
                        alloc.costType === 'per-guest' ? 'badge-per-guest' : 'badge-fixed'
                      }`}
                    >
                      {alloc.costType}
                    </span>
                    {alloc.costType === 'per-guest' && alloc.perGuestAmount && (
                      <div className="category-subtext">
                        ₹{alloc.perGuestAmount.toLocaleString('en-IN')} / guest
                      </div>
                    )}
                  </div>
                  <div className="category-stats">
                    <div className="category-amount">
                      ₹{alloc.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="category-subtext">{alloc.percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Differences List */}
          {differences.length > 0 && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--accent-amber)' }}>
                Recalculation Differences ({differences.length})
              </h3>
              {differences.map((diff, index) => (
                <div key={index} style={{ fontSize: '0.85rem', marginBottom: '0.6rem', color: '#cbd5e1' }}>
                  <strong>[{diff.category.toUpperCase()}]:</strong> {diff.reason}
                  {diff.suggestedUse && (
                    <div style={{ color: 'var(--accent-blue)', marginTop: '0.2rem' }}>
                      💡 <em>Suggested Use:</em> {diff.suggestedUse}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Timeline & Dependency Scheduler */}
        <section className="card">
          <div className="card-title">
            <span>Timeline & Feasibility</span>
            <span className="badge badge-fixed">Topologically Sorted</span>
          </div>

          <form onSubmit={handleUpdateTimeline} style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Event Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Today (Reference Date)</label>
                <input
                  type="date"
                  className="form-input"
                  value={todayReference}
                  onChange={(e) => setTodayReference(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Recalculate Deadlines & Feasibility
            </button>
          </form>

          {/* Overdue Warnings */}
          {timelineWarnings.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-rose)', marginBottom: '0.5rem' }}>
                ⚠️ Feasibility Warnings ({timelineWarnings.length})
              </h4>
              {timelineWarnings.map((warn, i) => (
                <div key={i} className="alert alert-warning" style={{ padding: '0.6rem 0.8rem', fontSize: '0.8rem' }}>
                  {warn}
                </div>
              ))}
            </div>
          )}

          {/* Task List */}
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
              Execution Order ({tasks.length} Tasks)
            </h3>
            {tasks.map((task, idx) => (
              <div key={task.id} className={`task-item status-${task.status}`}>
                <div className="task-header">
                  <div>
                    <span style={{ fontWeight: 700, marginRight: '0.5rem' }}>
                      {idx + 1}. {task.name}
                    </span>
                    <span className={`badge badge-${task.status}`}>{task.status}</span>
                  </div>

                  {task.status !== 'cancelled' && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                      onClick={() => handleCancelTask(task.id)}
                    >
                      Cancel Vendor
                    </button>
                  )}
                </div>

                <div className="task-meta">
                  <span>📅 Deadline: {task.deadline}</span>
                  <span>⏳ Lead time: {task.daysBeforeEvent} days</span>
                  {task.dependsOn.length > 0 && (
                    <span>🔗 Depends on: {task.dependsOn.join(', ')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
