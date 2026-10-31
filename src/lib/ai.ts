/**
 * Unified server-side AI helper for Event Planner.
 * All OpenRouter LLM interactions happen strictly through this module.
 *
 * Security & Reliability guarantees:
 * - Uses OpenAI client configured with OpenRouter baseURL
 * - Enforces 25-second timeout and 1 automatic retry
 * - Strips <think>...</think> blocks (DeepSeek R1/Qwen) and markdown fences
 * - Validates output via Zod schemas
 * - Never logs user prompts, input text, or API keys
 * - Gracefully falls back to realistic demo mode data on failure or missing key
 */

import OpenAI from 'openai';
import { z } from 'zod';

export interface AICallConfig<T> {
  systemPrompt?: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  demoFallback: T;
  model?: string;
}

export interface AICallResult<T> {
  data: T;
  demo: boolean;
}

/**
 * Strips <think>...</think> reasoning traces, markdown code fences,
 * and extracts the outermost JSON object or array.
 */
export function cleanAIResponse(raw: string): string {
  if (!raw) return '';

  // 1. Remove <think>...</think> blocks from reasoning models
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Remove markdown code fences ```json ... ``` or ``` ... ```
  text = text.replace(/^```[a-zA-Z]*\n?/gm, '').replace(/```$/gm, '').trim();

  // 3. Find outer JSON boundaries ({...} or [...])
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  // Determine whether an object or array is the outer structure
  const hasBraces = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace;
  const hasBrackets = firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket;

  if (hasBraces && hasBrackets) {
    if (firstBrace < firstBracket) {
      return text.slice(firstBrace, lastBrace + 1);
    } else {
      return text.slice(firstBracket, lastBracket + 1);
    }
  } else if (hasBraces) {
    return text.slice(firstBrace, lastBrace + 1);
  } else if (hasBrackets) {
    return text.slice(firstBracket, lastBracket + 1);
  }

  return text;
}

/**
 * Creates an OpenAI client configured for OpenRouter.
 */
function getOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    timeout: 25000,
    defaultHeaders: {
      'HTTP-Referer': 'https://event-planner.local',
      'X-Title': 'Event Planner',
    },
  });
}

/**
 * Executes a single AI completion attempt with OpenRouter.
 */
async function executeAttempt<T>(
  client: OpenAI,
  model: string,
  systemPrompt: string | undefined,
  userPrompt: string,
  schema: z.ZodType<T>
): Promise<T> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const completion = await client.chat.completions.create(
    {
      model,
      messages,
      temperature: 0.2,
    },
    { timeout: 25000 }
  );

  const rawContent = completion.choices?.[0]?.message?.content ?? '';
  const cleaned = cleanAIResponse(rawContent);
  const parsedJson = JSON.parse(cleaned);
  return schema.parse(parsedJson);
}

/**
 * Core AI call helper.
 * Reads API key and model strictly from process.env.
 * Retries once on error/invalid output, then returns demo mode fallback.
 */
export async function callAI<T>(config: AICallConfig<T>): Promise<AICallResult<T>> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const defaultModel = 'qwen/qwen3-next-80b-a3b-instruct';
  const model = config.model || process.env.OPENROUTER_MODEL?.trim() || defaultModel;

  // If key is missing, empty, or placeholder, fall back immediately to demo mode
  if (!apiKey || apiKey === 'your_key_here' || apiKey.length < 10) {
    return { data: config.demoFallback, demo: true };
  }

  let client: OpenAI;
  try {
    client = getOpenAIClient(apiKey);
  } catch {
    // If client instantiation fails, return demo fallback
    return { data: config.demoFallback, demo: true };
  }

  // Attempt 1
  try {
    const data = await executeAttempt(
      client,
      model,
      config.systemPrompt,
      config.userPrompt,
      config.schema
    );
    return { data, demo: false };
  } catch {
    // Attempt 1 failed - retry once without logging sensitive details
  }

  // Attempt 2 (Retry once)
  try {
    const data = await executeAttempt(
      client,
      model,
      config.systemPrompt,
      config.userPrompt,
      config.schema
    );
    return { data, demo: false };
  } catch {
    // Attempt 2 failed - gracefully return demo mode fallback
    return { data: config.demoFallback, demo: true };
  }
}
