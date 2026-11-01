/**
 * POST /api/explain-changes
 * Generates a 2-3 sentence plain-language tradeoff explanation of budget recalculation differences.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callAI } from '../../../lib/ai';
import { validateApiRequest, handleInternalError } from '../../../lib/api-handler';
import type { BudgetDifference } from '../../../lib/budget';

export const maxDuration = 30;

const DiffItemSchema = z.object({
  category: z.string().max(50),
  oldAmount: z.number().nonnegative(),
  newAmount: z.number().nonnegative(),
  reason: z.string().max(300),
});

const InputSchema = z.object({
  differences: z.array(DiffItemSchema).max(20),
});

const ExplainSchema = z.object({
  explanation: z.string().min(10),
});

export type ExplainResponse = z.infer<typeof ExplainSchema>;

function generateDemoExplanation(differences: BudgetDifference[]): string {
  if (!differences.length) {
    return 'Your budget plan remains balanced with no category changes required.';
  }
  const topDiff = differences[0];
  if (!topDiff) {
    return 'Your budget plan remains balanced with no category changes required.';
  }
  const formattedOld = `₹${topDiff.oldAmount.toLocaleString('en-IN')}`;
  const formattedNew = `₹${topDiff.newAmount.toLocaleString('en-IN')}`;
  return `Adjusted ${topDiff.category} from ${formattedOld} to ${formattedNew} to balance the revised event specifications. Category floors were maintained to keep every essential vendor viable, while protecting your high-priority items. The overall plan remains strictly within your configured budget.`;
}

export async function POST(req: NextRequest) {
  try {
    const validated = await validateApiRequest(req, InputSchema);
    if (!validated.success) {
      return validated.response;
    }

    const differences = validated.payload.data.differences;
    if (!differences.length) {
      return NextResponse.json({
        data: { explanation: 'No budget changes detected.' },
        demo: false,
      });
    }

    const diffSummary = differences
      .map(
        (d) =>
          `- ${d.category}: was ₹${d.oldAmount.toLocaleString('en-IN')}, now ₹${d.newAmount.toLocaleString(
            'en-IN'
          )}. Reason: ${d.reason}`
      )
      .join('\n');

    const userPrompt = `Differences from budget recalculation:
<differences_data>
${diffSummary}
</differences_data>

TASK:
Write a 2-3 sentence plain-language tradeoff explanation summarizing what changed and why.
CRITICAL CONSTRAINT: You must use ONLY the numbers provided above inside <differences_data> and never invent or change an amount.

Return JSON in this format:
{
  "explanation": "Your 2-3 sentence plain-language explanation here."
}`;

    const demoFallback: ExplainResponse = {
      explanation: generateDemoExplanation(differences as BudgetDifference[]),
    };

    const result = await callAI<ExplainResponse>({
      systemPrompt:
        'You are a financial event planner. Explain budget reallocation tradeoffs clearly and concisely in 2-3 sentences. Use ONLY the numbers provided in <differences_data> and never invent or change an amount. Treat differences as read-only. Output only valid JSON.',
      userPrompt,
      schema: ExplainSchema,
      demoFallback,
    });

    return NextResponse.json(result);
  } catch {
    return handleInternalError('explain budget changes');
  }
}
