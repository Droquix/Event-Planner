/**
 * Sanitizes raw LLM output by removing reasoning tokens (<think>),
 * markdown code fences, and extracting valid JSON boundaries.
 */

export function cleanAIResponse(raw: string): string {
  if (!raw) return '';

  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text
    .replace(/^```[a-zA-Z]*\n?/gm, '')
    .replace(/```$/gm, '')
    .trim();

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  const hasBraces = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace;
  const hasBrackets = firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket;

  if (hasBraces && hasBrackets) {
    return firstBrace < firstBracket
      ? text.slice(firstBrace, lastBrace + 1)
      : text.slice(firstBracket, lastBracket + 1);
  }
  if (hasBraces) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  if (hasBrackets) {
    return text.slice(firstBracket, lastBracket + 1);
  }

  return text;
}
