/**
 * Configuration and result types for LLM interactions.
 */
import type { z } from 'zod';

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
