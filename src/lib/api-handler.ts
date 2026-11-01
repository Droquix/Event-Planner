/**
 * Shared server-side API request handler and validation utility.
 * Standardizes rate limiting, payload size capping, JSON parsing, and Zod validation across all API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from './rate-limit';
import { MAX_REQUEST_BODY_BYTES } from './constants';

export interface ValidatedRequest<T> {
  data: T;
  clientIp: string;
}

/**
 * Validates an incoming NextRequest with IP rate-limiting, body size checks, and Zod parsing.
 * Returns either a NextResponse error (to return immediately) or the validated payload data.
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
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before retrying.' },
        { status: 429 }
      ),
    };
  }

  // 2. Request Body Read & Size Guard
  const rawBody = await req.text().catch(() => '');
  if (!rawBody || rawBody.length > maxBytes) {
    return {
      success: false,
      response: NextResponse.json(
        { error: `Payload too large. Maximum allowed size is ${maxBytes} bytes.` },
        { status: 400 }
      ),
    };
  }

  // 3. JSON Parse Guard
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid JSON payload format.' }, { status: 400 }),
    };
  }

  // 4. Zod Schema Validation
  const result = schema.safeParse(parsedJson);
  if (!result.success) {
    const firstErrorMessage = result.error.issues?.[0]?.message || 'Invalid request parameters.';
    return {
      success: false,
      response: NextResponse.json({ error: firstErrorMessage }, { status: 400 }),
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
 * Standardized 500 internal server error response generator.
 * Never leaks internal traces, system paths, or raw stack traces.
 */
export function handleInternalError(context: string): NextResponse {
  return NextResponse.json({ error: `Failed to ${context}. Please try again.` }, { status: 500 });
}
