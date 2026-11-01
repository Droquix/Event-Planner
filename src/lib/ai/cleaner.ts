/**
 * Sanitizes raw LLM output by removing reasoning tokens (<think>),
 * markdown code fences, and extracting valid JSON boundaries.
 */

function extractBoundedSubstring(text: string, openChar: string, closeChar: string): string | null {
  const first = text.indexOf(openChar);
  const last = text.lastIndexOf(closeChar);
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1);
  }
  return null;
}

export function cleanAIResponse(raw: string): string {
  if (!raw) return '';

  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text
    .replace(/^```[a-zA-Z]*\n?/gm, '')
    .replace(/```$/gm, '')
    .trim();

  const objectStr = extractBoundedSubstring(text, '{', '}');
  const arrayStr = extractBoundedSubstring(text, '[', ']');

  if (objectStr && arrayStr) {
    return text.indexOf('{') < text.indexOf('[') ? objectStr : arrayStr;
  }
  return objectStr ?? arrayStr ?? text;
}
