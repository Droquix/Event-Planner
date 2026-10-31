/**
 * POST /api/ideas
 * Generates 5 personalized creative ideas respecting occasion, city, priorities, guest count, and surplus.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callAI } from '../../../lib/ai';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';

export const maxDuration = 30;

const IdeaItemSchema = z.object({
  title: z.string(),
  whyItFits: z.string(),
  costRange: z.string(),
});

const IdeasSchema = z.object({
  ideas: z.array(IdeaItemSchema).min(1),
});

export type IdeasResponse = z.infer<typeof IdeasSchema>;

const DEMO_IDEAS: IdeasResponse = {
  ideas: [
    {
      title: 'Live Regional Food Station',
      whyItFits: 'Elevates catering experience with interactive culinary engagement for your guests.',
      costRange: '₹15,000 - ₹35,000',
    },
    {
      title: 'Drone Aerial Highlights & Teaser Video',
      whyItFits: 'Enhances photography priority with cinematic outdoor venue perspectives and quick social cuts.',
      costRange: '₹20,000 - ₹40,000',
    },
    {
      title: 'Bespoke Floral Photo-Op Backdrop',
      whyItFits: 'Creates a striking focal point for guest portraits while optimizing overall decor spend.',
      costRange: '₹18,000 - ₹30,000',
    },
    {
      title: 'Acoustic Welcome Duo',
      whyItFits: 'Sets an inviting ambience during guest arrivals without overpowering conversation.',
      costRange: '₹12,000 - ₹25,000',
    },
    {
      title: 'Personalized Guest Welcome Hampers',
      whyItFits: 'Adds a warm hospitality touch with locally sourced treats tailored to your city.',
      costRange: '₹10,000 - ₹22,000',
    },
  ],
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

    const rawBody = await req.text();
    if (rawBody.length > 1000) {
      return NextResponse.json(
        { error: 'Input is too long. Please limit to 1000 characters.' },
        { status: 400 }
      );
    }

    let body: {
      occasion?: string;
      city?: string;
      priorities?: string[];
      guestCount?: number;
      surplus?: number;
    };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const occasion = body.occasion?.trim() || 'event';
    const city = body.city?.trim() || 'local area';
    const priorities = Array.isArray(body.priorities) && body.priorities.length ? body.priorities.join(', ') : 'overall quality';
    const guestCount = typeof body.guestCount === 'number' && body.guestCount > 0 ? body.guestCount : 100;
    const surplus = typeof body.surplus === 'number' && body.surplus > 0 ? `₹${body.surplus.toLocaleString('en-IN')}` : 'standard buffer';

    const userPrompt = `Event parameters:
- Occasion: ${occasion}
- City: ${city}
- Priorities: ${priorities}
- Guest Count: ${guestCount}
- Available Surplus: ${surplus}

TASK:
Provide exactly 5 personalized event ideas that respect the budget constraints.
For each idea provide:
1. title: short catchy title
2. whyItFits: 1 concise sentence explaining why it fits this specific event and priorities
3. costRange: realistic extra cost range in INR (e.g. "₹15,000 - ₹30,000")

Return valid JSON:
{
  "ideas": [
    { "title": "...", "whyItFits": "...", "costRange": "..." },
    { "title": "...", "whyItFits": "...", "costRange": "..." },
    { "title": "...", "whyItFits": "...", "costRange": "..." },
    { "title": "...", "whyItFits": "...", "costRange": "..." },
    { "title": "...", "whyItFits": "...", "costRange": "..." }
  ]
}`;

    const result = await callAI<IdeasResponse>({
      systemPrompt:
        'You are a creative event consultant. Suggest practical, high-impact ideas that fit the user budget and priorities. Output only valid JSON.',
      userPrompt,
      schema: IdeasSchema,
      demoFallback: DEMO_IDEAS,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate ideas.' },
      { status: 500 }
    );
  }
}
