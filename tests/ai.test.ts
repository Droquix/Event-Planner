import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { cleanAIResponse, callAI } from '../src/lib/ai';

// Mock the 'openai' package
const mockCreate = vi.fn();

vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    },
  };
});

describe('AI Helper & Fallback Engine (src/lib/ai.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const TestSchema = z.object({
    name: z.string(),
    budget: z.number(),
  });

  const demoData = {
    name: 'Sample Demo Event',
    budget: 100000,
  };

  // ── 1. Output cleaning & extraction ──────────────────────────────────────────

  describe('cleanAIResponse()', () => {
    it('cleans output wrapped in <think> tags and markdown code fences', () => {
      const raw = `<think>
I need to produce a JSON object with name and budget.
The name is "Royal Wedding" and budget is 500000.
</think>
\`\`\`json
{
  "name": "Royal Wedding",
  "budget": 500000
}
\`\`\``;

      const cleaned = cleanAIResponse(raw);
      expect(cleaned).toBe('{\n  "name": "Royal Wedding",\n  "budget": 500000\n}');
      const parsed = JSON.parse(cleaned);
      expect(parsed).toEqual({ name: 'Royal Wedding', budget: 500000 });
    });

    it('handles multiple code fences and nested text surrounding JSON', () => {
      const raw = `Here is your data:
\`\`\`
{
  "name": "Corporate Gala",
  "budget": 750000
}
\`\`\`
Hope this helps!`;

      const cleaned = cleanAIResponse(raw);
      const parsed = JSON.parse(cleaned);
      expect(parsed).toEqual({ name: 'Corporate Gala', budget: 750000 });
    });

    it('extracts top-level arrays correctly when brackets precede braces', () => {
      const raw = `Here are items:
[
  { "name": "Item A", "budget": 100 },
  { "name": "Item B", "budget": 200 }
]`;
      const cleaned = cleanAIResponse(raw);
      expect(cleaned.startsWith('[')).toBe(true);
      expect(cleaned.endsWith(']')).toBe(true);
      const parsed = JSON.parse(cleaned);
      expect(parsed).toHaveLength(2);
    });

    it('extracts bracketed lists with no braces', () => {
      const raw = `Results: ["food", "decor", "music"]`;
      const cleaned = cleanAIResponse(raw);
      expect(cleaned).toBe('["food", "decor", "music"]');
    });
  });

  // ── 2. Valid response handling ───────────────────────────────────────────────

  it('handles valid AI response and returns demo: false', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-valid-test-key-1234567890';

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ name: 'Valid Event', budget: 250000 }),
          },
        },
      ],
    });

    const result = await callAI({
      systemPrompt: 'You are an event planner assistant.',
      userPrompt: 'Test event',
      schema: TestSchema,
      demoFallback: demoData,
    });

    expect(result.demo).toBe(false);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: 'You are an event planner assistant.' },
          { role: 'user', content: 'Test event' },
        ],
      }),
      expect.anything()
    );
    expect(result.data).toEqual({ name: 'Valid Event', budget: 250000 });
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  // ── 3. Response wrapped in <think> tags and code fences ──────────────────────

  it('handles responses wrapped in <think> tags and code fences properly', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-valid-test-key-1234567890';

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: `<think>Reasoning through the budget numbers...</think>
\`\`\`json
{"name":"Thinker Wedding","budget":800000}
\`\`\``,
          },
        },
      ],
    });

    const result = await callAI({
      systemPrompt: 'You are an event planner assistant.',
      userPrompt: 'Test event',
      schema: TestSchema,
      demoFallback: demoData,
    });

    expect(result.demo).toBe(false);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: 'You are an event planner assistant.' },
          { role: 'user', content: 'Test event' },
        ],
      }),
      expect.anything()
    );
    expect(result.data).toEqual({ name: 'Thinker Wedding', budget: 800000 });
  });

  // ── 4. Invalid JSON handling and retry ───────────────────────────────────────

  it('handles invalid JSON output by retrying once and then falling back to demo mode', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-valid-test-key-1234567890';

    // Both attempts return broken JSON
    mockCreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'Sorry, I cannot help with that.' } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: '{ broken json: nil ' } }],
      });

    const result = await callAI({
      userPrompt: 'Invalid test',
      schema: TestSchema,
      demoFallback: demoData,
    });

    // Should retry once (total 2 calls) and fall back to demo mode
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.demo).toBe(true);
    expect(result.data).toEqual(demoData);
  });

  // ── 5. Missing key handling ─────────────────────────────────────────────────

  it('falls back immediately to demo mode without calling API when key is missing or placeholder', async () => {
    delete process.env.OPENROUTER_API_KEY;

    const resultWithoutKey = await callAI({
      userPrompt: 'Test',
      schema: TestSchema,
      demoFallback: demoData,
    });

    expect(resultWithoutKey.demo).toBe(true);
    expect(resultWithoutKey.data).toEqual(demoData);
    expect(mockCreate).not.toHaveBeenCalled();

    // Also test with placeholder value
    process.env.OPENROUTER_API_KEY = 'your_key_here';
    const resultWithPlaceholder = await callAI({
      userPrompt: 'Test',
      schema: TestSchema,
      demoFallback: demoData,
    });

    expect(resultWithPlaceholder.demo).toBe(true);
    expect(resultWithPlaceholder.data).toEqual(demoData);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // ── 6. Timeout handling and retry ───────────────────────────────────────────

  it('handles request timeout by retrying once and then falling back to demo mode', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-valid-test-key-1234567890';

    const timeoutErr = new Error('Request timed out after 25000ms');
    timeoutErr.name = 'APIConnectionTimeoutError';

    // Both attempts time out
    mockCreate.mockRejectedValueOnce(timeoutErr).mockRejectedValueOnce(timeoutErr);

    const result = await callAI({
      userPrompt: 'Timeout test',
      schema: TestSchema,
      demoFallback: demoData,
    });

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.demo).toBe(true);
    expect(result.data).toEqual(demoData);
  });

  // ── 7. Successful recovery on retry ──────────────────────────────────────────

  it('recovers successfully on the second attempt if attempt 1 fails', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-valid-test-key-1234567890';

    // Attempt 1 fails, Attempt 2 succeeds
    mockCreate.mockRejectedValueOnce(new Error('Transient network glitch')).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ name: 'Recovered Event', budget: 450000 }),
          },
        },
      ],
    });

    const result = await callAI({
      userPrompt: 'Retry test',
      schema: TestSchema,
      demoFallback: demoData,
    });

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.demo).toBe(false);
    expect(result.data).toEqual({ name: 'Recovered Event', budget: 450000 });
  });
});
