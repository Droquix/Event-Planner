# Architecture & System Design

## 1. Overview & Architectural Principles

The Event Planner application is designed with clean architectural boundaries, separating deterministic domain calculations, external AI assistance, thin Next.js API route orchestration, and presentational UI components.

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│   (React 18 client components, UI subcomponents, hooks) │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│       UI Custom Hooks       │ │      API Route Handlers     │
│ (useBudgetPlanner, etc.)    │ │  (parse-intake, ideas, etc) │
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │
               │                               ▼
               │                ┌─────────────────────────────┐
               │                │          AI Layer           │
               │                │ (client, cleaner, schemas)  │
               │                └──────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Domain Layer                         │
│     (Pure deterministic math: budget & timeline models)     │
└─────────────────────────────────────────────────────────────┘
```

## 2. Layer Responsibilities

### Domain Layer (`src/lib/domain/`)
- **Isolation**: Pure TypeScript functions only. No React dependencies, no DOM access, no external network calls.
- **Sub-domains**:
  - `budget/`: Validation, floor management, priority weighting, recalculation, tradeoff comparisons.
  - `timeline/`: Milestone calculations, dependency DAG construction, cycle detection, topological sorting, and downstream cascade analysis.
- **Invariants**: Every calculation is mathematically deterministic and invariant: `sum(allocations) + surplus === totalBudget` (within ₹1 rounding).

### AI Layer (`src/lib/ai/`)
- **Isolation**: Handles communication with LLM providers (e.g. OpenRouter) with strict timeout isolation (30s) and multi-layered resilient JSON sanitization.
- **Demarcation**: AI **cannot** mutate budget numbers, override calculations, or alter dependencies directly. AI is strictly consultative—generating plain-language tradeoff descriptions, creative enhancement ideas, and polite vendor outreach messages.
- **Demo Mode**: If AI calls fail, timeout, or return malformed output, the system seamlessly falls back to local deterministic templates, flagging the response with `demo: true`.

### Application & API Layer (`src/app/api/`)
- **Thin Handlers**: Every API route uses `validateApiRequest` and standard error mapping via `AppError`.
- **Error Isolation**: Client responses never include stack traces, internal system details, or sensitive server state.

### Presentation Layer (`src/components/`)
- **Decomposed Components**: Every component file is $< 250$ lines and functions are $< 80$ lines.
- **WAI-ARIA Accessibility**: Fully compliant with WCAG 2.1 AA, supporting roving `tabindex`, arrow key navigation, live regions, and explicit `aria-describedby` form error bindings.

## 3. Failure & Fallback Workflow

When an external AI request is initiated:
1. `useAbortableRequest` issues a fetch with an `AbortController`.
2. Server routes enforce rate limiting and parse requests using Zod schemas.
3. If an upstream AI provider fails or exceeds 30s, typed errors (`AIUnavailableError`, `RateLimitError`) return controlled status codes.
4. UI displays an `AIBadge` indicating "Demo mode - sample response" without blocking user interaction.
