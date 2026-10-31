/**
 * POST /api/vendor-questions
 * Generates a short, polite outreach message to a vendor asking for missing quotation information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callAI } from '../../../lib/ai';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';

export const maxDuration = 30;

const QuestionSchema = z.object({
  message: z.string().min(10),
});

export type VendorQuestionResponse = z.infer<typeof QuestionSchema>;

function generateDemoMessage(category: string, missingInfo: string[], vendorName?: string): string {
  const greeting = vendorName ? `Dear ${vendorName}` : 'Hello';
  const missingText = missingInfo.length ? missingInfo.join(', ') : 'commercial terms';
  return `${greeting}, thank you for sharing your quotation for our upcoming event. We are reviewing options for the ${category} scope and would appreciate clarification on a few details: ${missingText}. Could you please confirm these points and let us know your standard cancellation and payment terms at your earliest convenience? Thank you!`;
}

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
      category?: string;
      missingInfo?: string[];
      vendorName?: string;
    };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const category = body.category?.trim() || 'services';
    const missingInfo = Array.isArray(body.missingInfo) ? body.missingInfo.filter(Boolean) : [];
    const vendorName = body.vendorName?.trim() || undefined;

    const demoFallback: VendorQuestionResponse = {
      message: generateDemoMessage(category, missingInfo, vendorName),
    };

    const userPrompt = `Vendor Category: ${category}
${vendorName ? `Vendor Name: ${vendorName}` : ''}
Missing Information Items:
${missingInfo.length ? missingInfo.map((item) => `- ${item}`).join('\n') : '- Commercial payment and cancellation terms'}

TASK:
Write a short, professional, and polite message/email that the client can send to the vendor asking for these specific missing details before finalizing the booking. Keep it warm and concise (under 120 words).

Return valid JSON:
{
  "message": "The complete inquiry message here"
}`;

    const result = await callAI<VendorQuestionResponse>({
      systemPrompt:
        'You are a professional event coordinator. Draft polite, effective vendor inquiry messages. Output only valid JSON.',
      userPrompt,
      schema: QuestionSchema,
      demoFallback,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to draft vendor message.' },
      { status: 500 }
    );
  }
}
