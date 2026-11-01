# Event Planner — Intelligent GenAI Planning Assistant

A smart, full-featured event planning platform designed for weddings, birthdays, anniversaries, and community gatherings. Built with Next.js 14, React 18, TypeScript, and OpenRouter AI.

---

## 1. What It Does

Event Planner simplifies high-stakes event coordination into four synchronized modules:

1. **Intelligent Onboarding**:
   - Parses unstructured natural language briefs into structured parameters (occasion, date, budget in INR, guest count, city, and top priorities).
   - Dynamic prioritization (pick up to 3) weights key categories without starving essential services.
   - Clean, zero-persistence fresh start on reload with a prominent **"Start new plan"** reset workflow.

2. **Deterministic Budget & Tradeoff Engine**:
   - Computes weighted allocations across 6 canonical categories (`venue`, `catering`, `decor`, `photography`, `entertainment`, `misc`).
   - Guarantees strict financial invariants: preserves a minimum 3% floor rate per category to prevent vendor starvation.
   - Per-guest scaling for catering: dynamically recalculates costs when guest headcount changes and reports budget surplus with creative upgrade suggestions.
   - Automatically calls server-side AI to generate plain-language tradeoff explanations constrained strictly to provided numbers.

3. **Dependency-Based Timeline Scheduler**:
   - Directed Acyclic Graph (DAG) topological sorting backwards from the event milestone date.
   - Real-time feasibility engine detects overdue tasks against the current date.
   - Cascading risk propagation: cancelling a vendor automatically cascades and marks dependent downstream tasks as "at risk".
   - Warns when an event date has already passed or is invalid.

4. **Vendor Workspace & Coordination Assistant**:
   - Side-by-side quotation comparison with lowest-bid highlights.
   - Essential 7-point booking verification checklist (cancellation policy, advance deposit, overtime rates, GST inclusion, backup plans, payment schedule, written deliverables).
   - Automated AI outreach generator: drafts polite, targeted inquiry messages asking vendors for missing quotation details before committing.

---

## 2. Architecture: Deterministic Core vs. AI Helper

The application enforces a strict architectural boundary between math and language:

```
┌────────────────────────────────────────────────────────┐
│                   DETERMINISTIC CORE                   │
│  (src/lib/budget.ts & src/lib/timeline.ts)             │
│                                                        │
│  • Pure mathematical budget allocation & floors        │
│  • DAG topological sorting & cycle detection           │
│  • Milestone backward deadline math (UTC)              │
│  • Cascading cancellation risk propagation             │
│  • Invariant: sum(allocations) + surplus === budget    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           │ Feeds structured data
                           ▼
┌────────────────────────────────────────────────────────┐
│                      GENAI HELPER                      │
│  (src/lib/ai.ts & src/app/api/*)                       │
│                                                        │
│  • Natural language parsing (/api/parse-intake)        │
│  • Tradeoff summaries (/api/explain-changes)           │
│  • Personalized enhancements (/api/ideas)              │
│  • Vendor inquiry drafting (/api/vendor-questions)     │
│  • Fallback demo mode on missing key or failure        │
└────────────────────────────────────────────────────────┘
```

- **All financial math, deadlines, and dependencies are computed deterministically.**
- **AI never calculates, invents, or modifies budget allocations or calendar dates.**
- AI operates strictly as an asynchronous language assistant through server-side API routes wrapped in Zod schema validation.

---

## 3. Environment Variables

Configure environment variables in `.env.local` (never committed to version control):

| Variable Name | Description |
| :--- | :--- |
| `OPENROUTER_API_KEY` | OpenRouter API authentication key |
| `OPENROUTER_MODEL` | OpenRouter model identifier (default: `qwen/qwen3-next-80b-a3b-instruct`) |

*Note: If `OPENROUTER_API_KEY` is omitted, empty, or fails, the application seamlessly enters Demo Mode with realistic pre-written responses. The application never crashes due to AI availability.*

---

## 4. How to Run

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- npm 9+

### Setup & Development
```bash
# 1. Clone repository
git clone https://github.com/Droquix/Event-Planner.git
cd Event-Planner

# 2. Install dependencies
npm install

# 3. Configure environment (optional - demo mode runs out of the box)
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. How to Test

```bash
# Run complete test suite (48 tests across 6 suites)
npm test

# Run test coverage analysis
npx vitest run --coverage

# Run ESLint validation
npm run lint

# Run TypeScript typecheck
npx tsc --noEmit

# Run Next.js production build
npm run build
```

---

## 6. Assumptions & Constants

1. **Catering Per-Guest Floor**:
   - Assumes a market baseline minimum of ₹500/guest for basic sit-down meal service in Indian urban/semi-urban settings (`MIN_CATERING_COST_PER_GUEST = 500`).
2. **Category Minimum Allocation Floor**:
   - Enforces a 3% floor rate (`MIN_CATEGORY_FLOOR_RATE = 0.03`) and ₹50 absolute floor (`MIN_CATEGORY_FLOOR_INR = 50`) across all 6 categories to ensure no category is zeroed out during severe budget cuts.
3. **Surplus Isolation**:
   - When savings occur (e.g., guest count reduced), funds are reported as an unallocated `surplus` with suggested creative uses rather than silently dumped into miscellaneous expenses.
4. **Lead Times**:
   - Standard lead times follow realistic vendor booking cycles (e.g., Venue 180 days, Caterer 120 days, Photographer 120 days).

---

## 7. Known Limitations

1. **In-Memory Rate Limiting**:
   - Per-IP rate limiting (`src/lib/rate-limit.ts`) uses an in-memory sliding window cache. On multi-instance serverless deployments (such as Vercel Edge/Lambdas), rate limits operate per compute container. For enterprise production, a Redis/Upstash instance is recommended.
2. **Offline AI Calls**:
   - In environments without active internet connectivity, AI requests automatically fall back to deterministic Demo Mode responses.
3. **Multi-Day Itineraries**:
   - The current scheduling model targets single primary event milestones (e.g., wedding reception day, birthday party date) with preceding preparation lead times.

---

## 8. Security & Accessibility

- **Input Sanitization**: All API routes enforce strict Zod schemas with payload size caps ($\le 2000$ bytes) and string length bounds ($\le 1000$ chars).
- **Prompt Injection Defense**: User input is quarantined within `<user_event_brief>` and `<event_context>` XML tags with system-level instruction boundaries.
- **Plain Text Rendering**: AI responses are rendered exclusively as plain text strings (`{text}`); zero usage of `dangerouslySetInnerHTML`.
- **Security Headers**: `next.config.mjs` applies strict CSP (`default-src 'self'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Accessibility (a11y)**:
  - Valid `lang="en"`, skip-to-content keyboard bypass.
  - WAI-ARIA tab pattern (`tablist`, `tab`, `tabpanel`) with full ArrowLeft/ArrowRight keyboard support.
  - Real-time Screen Reader announcements via `LiveRegion` (`role="status"`, `aria-live="polite"`).
  - Status indicators use text labels and pill badges (never color alone).
  - Respects `@media (prefers-reduced-motion: reduce)`.
