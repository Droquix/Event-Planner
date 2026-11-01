/**
 * Centralized Application Constants & Numeric Guardrails.
 * Eliminates magic numbers across server and client layers.
 */

// API & AI Configuration
export const AI_REQUEST_TIMEOUT_MS = 25000;
export const AI_MAX_DURATION_SECONDS = 30;
export const MAX_REQUEST_BODY_BYTES = 2000;
export const MAX_INTAKE_TEXT_LENGTH = 1000;

// Business Validation Limits
export const MAX_EVENT_BUDGET_INR = 1_000_000_000; // ₹100 Crore
export const MAX_GUEST_COUNT = 100_000;
export const MAX_PRIORITIES_COUNT = 3;
export const MAX_VENDOR_NAME_LENGTH = 100;
export const MAX_VENDOR_INCLUDES_LENGTH = 500;
export const MIN_VENDOR_NAME_LENGTH = 1;

// Rate Limiting Constants
export const RATE_LIMIT_MAX_REQUESTS = 30;
export const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
export const RATE_LIMIT_MAX_ENTRIES = 10_000;
