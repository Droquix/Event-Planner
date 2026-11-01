/**
 * Application error classes mapped to explicit HTTP status codes.
 * Ensures internal errors or stack traces are never exposed to clients.
 */

export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly code = 'VALIDATION_ERROR';
}

export class RateLimitError extends AppError {
  public readonly statusCode = 429;
  public readonly code = 'RATE_LIMIT_ERROR';

  constructor(message = 'Rate limit exceeded. Please wait a moment before trying again.') {
    super(message);
  }
}

export class AIUnavailableError extends AppError {
  public readonly statusCode = 503;
  public readonly code = 'AI_UNAVAILABLE_ERROR';

  constructor(message = 'AI service temporarily unavailable.') {
    super(message);
  }
}

/**
 * Maps any error or thrown value to a safe HTTP status code and user-facing message.
 */
export function formatErrorResponse(err: unknown): { error: string; status: number } {
  if (err instanceof AppError) {
    return { error: err.message, status: err.statusCode };
  }
  if (err instanceof Error) {
    return { error: err.message, status: 500 };
  }
  return { error: 'An unexpected internal error occurred.', status: 500 };
}
