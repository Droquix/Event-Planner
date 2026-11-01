/**
 * OpenAI client wrapper configured for OpenRouter with automated retry and fallback.
 */
import OpenAI from 'openai';
import type { z } from 'zod';
import { AI_REQUEST_TIMEOUT_MS } from '../constants';
import { cleanAIResponse } from './cleaner';
import type { AICallConfig, AICallResult } from './types';

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
    { timeout: AI_REQUEST_TIMEOUT_MS }
  );

  const rawContent = completion.choices?.[0]?.message?.content ?? '';
  const cleaned = cleanAIResponse(rawContent);
  const parsedJson = JSON.parse(cleaned);
  return schema.parse(parsedJson);
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
    // Retry once
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
      return { data: config.demoFallback, demo: true };
    }
  }
}
