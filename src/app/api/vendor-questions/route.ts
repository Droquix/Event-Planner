/**
 * POST /api/vendor-questions
 * Generates a short, polite outreach message to a vendor asking for missing quotation information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callAI } from '../../../lib/ai';
import { validateApiRequest, handleInternalError } from '../../../lib/api-handler';

export const maxDuration = 30;

const QuestionSchema = z.object({
  message: z.string().min(10),
});

export type VendorQuestionResponse = z.infer<typeof QuestionSchema>;

const InputSchema = z.object({
  category: z.string().max(50),
  missingInfo: z.array(z.string().max(100)).max(20).optional(),
  vendorName: z.string().max(100).optional(),
});

function generateDemoMessage(category: string, missingInfo: string[], vendorName?: string): string {
  const greeting = vendorName ? `Dear ${vendorName}` : 'Hello';
  const missingText = missingInfo.length ? missingInfo.join(', ') : 'commercial terms';
  return `${greeting}, thank you for sharing your quotation for our upcoming event. We are reviewing options for the ${category} scope and would appreciate clarification on a few details: ${missingText}. Could you please confirm these points and let us know your standard cancellation and payment terms at your earliest convenience? Thank you!`;
}

export async function POST(req: NextRequest) {
  try {
    const validated = await validateApiRequest(req, InputSchema);
    if (!validated.success) {
      return validated.response;
    }

    const {
      category: rawCategory,
      missingInfo: rawMissingInfo,
      vendorName: rawVendorName,
    } = validated.payload.data;
    const category = rawCategory.trim() || 'services';
    const missingInfo = rawMissingInfo?.filter(Boolean) || [];
    const vendorName = rawVendorName?.trim() || undefined;

    const demoFallback: VendorQuestionResponse = {
      message: generateDemoMessage(category, missingInfo, vendorName),
    };

    const userPrompt = `Vendor details:
<vendor_context>
- Category: ${category}
${vendorName ? `- Name: ${vendorName}` : ''}
- Missing Information Items:
${missingInfo.length ? missingInfo.map((item) => `  * ${item}`).join('\n') : '  * Commercial payment and cancellation terms'}
</vendor_context>

TASK:
Write a short, professional, and polite message/email that the client can send to the vendor asking for these specific missing details before finalizing the booking. Keep it warm and concise (under 120 words).

Return valid JSON:
{
  "message": "The complete inquiry message here"
}`;

    const result = await callAI<VendorQuestionResponse>({
      systemPrompt:
        'You are a professional event coordinator. Draft polite, effective vendor inquiry messages based on <vendor_context>. Output only valid JSON.',
      userPrompt,
      schema: QuestionSchema,
      demoFallback,
    });

    return NextResponse.json(result);
  } catch {
    return handleInternalError('draft vendor message');
  }
}
