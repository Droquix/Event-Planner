/**
 * POST /api/parse-intake
 * Extracts structured event planning details from free text using OpenRouter AI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callAI } from '../../../lib/ai';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';
import { ALL_CATEGORIES, normalizeCategory, type BudgetCategory } from '../../../lib/budget';

export const maxDuration = 30;

const IntakeSchema = z.object({
  occasion: z.string().default(''),
  date: z.string().default(''),
  budget: z.number().nullable().default(null),
  guestCount: z.number().nullable().default(null),
  city: z.string().default(''),
  priorities: z.array(z.string()).default([]),
});

export type ParsedIntake = z.infer<typeof IntakeSchema>;

const DEMO_FALLBACK: ParsedIntake = {
  occasion: 'wedding',
  date: '2026-11-20',
  budget: 1500000,
  guestCount: 200,
  city: 'Pune',
  priorities: ['catering', 'photography'],
};

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before retrying.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const text: string = typeof body?.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return NextResponse.json(
        { error: 'Please provide event description text.' },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      return NextResponse.json(
        { error: 'Input is too long. Please limit to 1000 characters.' },
        { status: 400 }
      );
    }

    const userPrompt = `Extract event planning details from this description into structured JSON:
"""${text}"""

Return JSON matching:
{
  "occasion": "type of event (e.g. wedding, birthday, corporate)",
  "date": "YYYY-MM-DD if specified, else empty string",
  "budget": number in INR or null,
  "guestCount": integer number of guests or null,
  "city": "city name if mentioned, else empty string",
  "priorities": ["up to 3 prioritized categories from: venue, catering, decor, photography, entertainment, misc"]
}`;

    const result = await callAI<ParsedIntake>({
      systemPrompt:
        'You are an expert event planning assistant. Extract event details from user descriptions into precise JSON. Only output valid JSON.',
      userPrompt,
      schema: IntakeSchema,
      demoFallback: DEMO_FALLBACK,
    });

    // Enforce valid categories from budget.ts on priorities
    const validatedPriorities: BudgetCategory[] = [];
    for (const p of result.data.priorities) {
      const normalized = normalizeCategory(p);
      if (normalized && ALL_CATEGORIES.includes(normalized) && !validatedPriorities.includes(normalized)) {
        validatedPriorities.push(normalized);
      }
    }

    return NextResponse.json({
      data: {
        ...result.data,
        priorities: validatedPriorities.slice(0, 3),
      },
      demo: result.demo,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}
