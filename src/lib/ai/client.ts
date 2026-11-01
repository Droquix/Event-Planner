/**
 * OpenAI client wrapper configured for OpenRouter with automated retry and fallback.
 */
import OpenAI from 'openai';
import type { z } from 'zod';
import { AI_REQUEST_TIMEOUT_MS } from '../constants';
import { cleanAIResponse } from './cleaner';
import type { AICallConfig, AICallResult } from './types';

interface AttemptOptions<T> {
  client: OpenAI;
  model: string;
  systemPrompt?: string;
  userPrompt: string;
  schema: z.ZodType<T>;
}

/**
 * Creates an OpenAI client configured for OpenRouter.
 */
function getOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    timeout: AI_REQUEST_TIMEOUT_MS,
    defaultHeaders: {
      'HTTP-Referer': 'https://event-planner.local',
      'X-Title': 'Event Planner',
    },
  });
}

/**
 * Executes a single completion attempt and parses JSON response against schema.
 */
async function executeAttempt<T>(opts: AttemptOptions<T>): Promise<T> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (opts.systemPrompt) {
    messages.push({ role: 'system', content: opts.systemPrompt });
  }
  messages.push({ role: 'user', content: opts.userPrompt });

  const completion = await opts.client.chat.completions.create(
    {
      model: opts.model,
      messages,
      temperature: 0.2,
    },
    { timeout: AI_REQUEST_TIMEOUT_MS }
  );

  const rawContent = completion.choices?.[0]?.message?.content ?? '';
  const cleaned = cleanAIResponse(rawContent);
  const parsedJson = JSON.parse(cleaned);
  return opts.schema.parse(parsedJson);
}

/**
 * Core AI caller. Retries once on error/invalid output, then returns demo fallback.
 */
export async function callAI<T>(config: AICallConfig<T>): Promise<AICallResult<T>> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const defaultModel = 'qwen/qwen3-next-80b-a3b-instruct';
  const model = config.model || process.env.OPENROUTER_MODEL?.trim() || defaultModel;

  if (!apiKey || apiKey === 'your_key_here' || apiKey.length < 10) {
    return { data: config.demoFallback, demo: true };
  }

  let client: OpenAI;
  try {
    client = getOpenAIClient(apiKey);
  } catch {
    return { data: config.demoFallback, demo: true };
  }

  const opts: AttemptOptions<T> = {
    client,
    model,
    systemPrompt: config.systemPrompt,
    userPrompt: config.userPrompt,
    schema: config.schema,
  };

  try {
    const data = await executeAttempt(opts);
    return { data, demo: false };
  } catch {
    try {
      const data = await executeAttempt(opts);
      return { data, demo: false };
    } catch {
      return { data: config.demoFallback, demo: true };
    }
  }
}
