/**
 * POST /api/parse-intake
 * Parses a free-text event description and extracts structured fields.
 * Uses the Gemini API when GEMINI_API_KEY is set; otherwise falls back
 * to deterministic regex/keyword extraction so the app works without a key.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface ParsedIntake {
  occasion: string;
  date: string;        // YYYY-MM-DD or empty string
  budget: number | null;
  guestCount: number | null;
  city: string;
  priorities: string[];
}

// ── Fallback parser (no API key needed) ─────────────────────────────────────

const OCCASION_KEYWORDS: Record<string, string> = {
  wedding: 'wedding',
  marry: 'wedding',
  bride: 'wedding',
  groom: 'wedding',
  anniversary: 'anniversary',
  birthday: 'birthday',
  'bday': 'birthday',
  party: 'party',
  graduation: 'graduation',
  corporate: 'corporate',
  conference: 'conference',
  engagement: 'engagement',
  reception: 'reception',
  baby: 'baby shower',
  shower: 'baby shower',
  festival: 'festival',
  puja: 'puja / pooja',
  pooja: 'puja / pooja',
  sangeet: 'sangeet',
  mehendi: 'mehendi',
};

const PRIORITY_KEYWORDS = [
  'food', 'catering', 'decor', 'decoration', 'photography', 'venue',
  'entertainment', 'music', 'dj', 'flowers', 'misc',
];

function extractOccasion(text: string): string {
  const lower = text.toLowerCase();
  for (const [kw, label] of Object.entries(OCCASION_KEYWORDS)) {
    if (lower.includes(kw)) return label;
  }
  return '';
}

function extractDate(text: string): string {
  // Try explicit YYYY-MM-DD
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];

  // Try "15 November 2025" or "November 15 2025"
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10',
    november: '11', december: '12',
  };
  const mKeys = Object.keys(months).join('|');
  const m1 = text.match(new RegExp(`(\\d{1,2})\\s+(${mKeys})\\s+(20\\d{2})`, 'i'));
  if (m1) {
    const d = m1[1].padStart(2, '0');
    const mo = months[m1[2].toLowerCase()];
    return `${m1[3]}-${mo}-${d}`;
  }
  const m2 = text.match(new RegExp(`(${mKeys})\\s+(\\d{1,2})[,\\s]+(20\\d{2})`, 'i'));
  if (m2) {
    const d = m2[2].padStart(2, '0');
    const mo = months[m2[1].toLowerCase()];
    return `${m2[3]}-${mo}-${d}`;
  }
  return '';
}

function extractBudget(text: string): number | null {
  // Match "50 lakh", "5L", "50,000", "5 crore", etc.
  const lakh = text.match(/(\d[\d,.]*)\s*(?:lakh|lac|L)\b/i);
  if (lakh) return parseFloat(lakh[1].replace(/,/g, '')) * 100_000;
  const crore = text.match(/(\d[\d,.]*)\s*crore\b/i);
  if (crore) return parseFloat(crore[1].replace(/,/g, '')) * 10_000_000;
  const inr = text.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]*)\b/i);
  if (inr) {
    const v = parseInt(inr[1].replace(/,/g, ''), 10);
    if (v > 0) return v;
  }
  return null;
}

function extractGuests(text: string): number | null {
  const m = text.match(/(\d+)\s*(?:guest|people|person|pax|head|attendee)/i);
  if (m) return parseInt(m[1], 10);
  const m2 = text.match(/for\s+(\d+)/i);
  if (m2) return parseInt(m2[1], 10);
  return null;
}

function extractCity(text: string): string {
  const CITIES = [
    'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai',
    'kolkata', 'pune', 'ahmedabad', 'jaipur', 'surat', 'lucknow',
    'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'patna',
    'vadodara', 'chandigarh', 'coimbatore', 'agra', 'kochi',
    'goa', 'udaipur', 'mysore', 'amritsar', 'visakhapatnam',
  ];
  const lower = text.toLowerCase();
  for (const c of CITIES) {
    if (lower.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  return '';
}

function extractPriorities(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const kw of PRIORITY_KEYWORDS) {
    if (lower.includes(kw) && !found.includes(kw)) found.push(kw);
  }
  return found.slice(0, 3);
}

function fallbackParse(text: string): ParsedIntake {
  return {
    occasion: extractOccasion(text),
    date: extractDate(text),
    budget: extractBudget(text),
    guestCount: extractGuests(text),
    city: extractCity(text),
    priorities: extractPriorities(text),
  };
}

// ── Gemini-powered parser ────────────────────────────────────────────────────

async function geminiParse(text: string, apiKey: string): Promise<ParsedIntake> {
  const prompt = `Extract event planning details from this description and return ONLY valid JSON with these exact fields:
{
  "occasion": "<type of event, e.g. wedding, birthday, corporate>",
  "date": "<YYYY-MM-DD if mentioned, else empty string>",
  "budget": <number in INR, null if not mentioned>,
  "guestCount": <number, null if not mentioned>,
  "city": "<city name if mentioned, else empty string>",
  "priorities": [<up to 3 from: food, catering, decor, photography, venue, entertainment, misc>]
}

Description: """${text}"""

Return only the JSON object, no explanation.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 512 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const json = await res.json();
  const raw: string =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  // Strip markdown fences if present
  const cleaned = raw.replace(/```(?:json)?\n?/gi, '').trim();
  return JSON.parse(cleaned) as ParsedIntake;
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body?.text ?? '';

    if (!text.trim()) {
      return NextResponse.json({ error: 'No text provided.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let parsed: ParsedIntake;

    if (apiKey) {
      try {
        parsed = await geminiParse(text, apiKey);
      } catch {
        // Fallback to regex parser on Gemini error
        parsed = fallbackParse(text);
      }
    } else {
      parsed = fallbackParse(text);
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Parse error' },
      { status: 500 }
    );
  }
}
