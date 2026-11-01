/**
 * Shared server-side API request handler and validation utility.
 * Standardizes rate limiting, payload size capping, JSON parsing, and Zod validation across all API routes.
 */

import { type NextRequest, NextResponse } from 'next/server';
import type { z } from 'zod';
import { checkRateLimit, getClientIp } from './rate-limit';
import { MAX_REQUEST_BODY_BYTES } from './constants';
import { RateLimitError, ValidationError, formatErrorResponse } from './errors';

export interface ValidatedRequest<T> {
  data: T;
  clientIp: string;
}

/**
 * Validates an incoming NextRequest with IP rate-limiting, body size checks, and Zod parsing.
 */
export async function validateApiRequest<T>(
  req: NextRequest,
  schema: z.ZodType<T>,
  maxBytes: number = MAX_REQUEST_BODY_BYTES
): Promise<
  { success: true; payload: ValidatedRequest<T> } | { success: false; response: NextResponse }
> {
  // 1. Rate Limiting Check
  const clientIp = getClientIp(req);
  const { allowed } = checkRateLimit(clientIp);
  if (!allowed) {
    const err = new RateLimitError();
    return {
      success: false,
      response: NextResponse.json({ error: err.message }, { status: err.statusCode }),
    };
  }

  // 2. Request Body Read & Size Guard
  const rawBody = await req.text().catch(() => '');
  if (!rawBody || rawBody.length > maxBytes) {
    const err = new ValidationError(
      `Payload too large. Maximum allowed size is ${maxBytes} bytes.`
    );
    return {
      success: false,
      response: NextResponse.json({ error: err.message }, { status: err.statusCode }),
    };
  }

  // 3. JSON Parse Guard
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    const err = new ValidationError('Invalid JSON payload format.');
    return {
      success: false,
      response: NextResponse.json({ error: err.message }, { status: err.statusCode }),
    };
  }

  // 4. Zod Schema Validation
  const result = schema.safeParse(parsedJson);
  if (!result.success) {
    const firstErrorMessage = result.error.issues?.[0]?.message || 'Invalid request parameters.';
    const err = new ValidationError(firstErrorMessage);
    return {
      success: false,
      response: NextResponse.json({ error: err.message }, { status: err.statusCode }),
    };
  }

  return {
    success: true,
    payload: {
      data: result.data,
      clientIp,
    },
  };
}

/**
 * Standardized internal server error response generator.
 * Never leaks internal traces, system paths, or raw stack traces.
 */
export function handleInternalError(context: string, originalError?: unknown): NextResponse {
  if (originalError) {
    const { error, status } = formatErrorResponse(originalError);
    if (status !== 500) {
      return NextResponse.json({ error }, { status });
    }
  }
  return NextResponse.json({ error: `Failed to ${context}. Please try again.` }, { status: 500 });
}
