import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as parseIntakeRoute } from '../src/app/api/parse-intake/route';
import { POST as explainChangesRoute } from '../src/app/api/explain-changes/route';
import { POST as ideasRoute } from '../src/app/api/ideas/route';
import { POST as vendorQuestionsRoute } from '../src/app/api/vendor-questions/route';

describe('API Route Validation & Security (Phase 4)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function makeReq(url: string, body: unknown): NextRequest {
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  describe('POST /api/parse-intake', () => {
    it('returns 400 if text is empty', async () => {
      const req = makeReq('/api/parse-intake', { text: '' });
      const res = await parseIntakeRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('returns 400 if text exceeds 1000 characters', async () => {
      const longText = 'a'.repeat(1001);
      const req = makeReq('/api/parse-intake', { text: longText });
      const res = await parseIntakeRoute(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/1000 characters/i);
    });

    it('returns valid fallback in demo mode when API key is missing', async () => {
      delete process.env.OPENROUTER_API_KEY;
      const req = makeReq('/api/parse-intake', {
        text: 'Wedding in Pune for 200 guests on 2026-11-20, budget 15 lakhs.',
      });
      const res = await parseIntakeRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.demo).toBe(true);
      expect(json.data.occasion).toBe('wedding');
      expect(json.data.budget).toBe(1500000);
    });
  });

  describe('POST /api/explain-changes', () => {
    it('returns 200 with no changes message when differences array is empty', async () => {
      const req = makeReq('/api/explain-changes', { differences: [] });
      const res = await explainChangesRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.explanation).toMatch(/No budget changes detected/i);
    });

    it('returns 400 on malformed differences schema', async () => {
      const req = makeReq('/api/explain-changes', {
        differences: [{ category: 123, oldAmount: 'invalid' }],
      });
      const res = await explainChangesRoute(req);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/ideas', () => {
    it('generates 5 ideas adhering to schema in demo fallback mode', async () => {
      delete process.env.OPENROUTER_API_KEY;
      const req = makeReq('/api/ideas', {
        occasion: 'wedding',
        city: 'Mumbai',
        priorities: ['food', 'photography'],
        guestCount: 200,
        surplus: 50000,
      });
      const res = await ideasRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.demo).toBe(true);
      expect(json.data.ideas).toHaveLength(5);
      expect(json.data.ideas[0]).toHaveProperty('title');
      expect(json.data.ideas[0]).toHaveProperty('whyItFits');
      expect(json.data.ideas[0]).toHaveProperty('costRange');
    });
  });

  describe('POST /api/vendor-questions', () => {
    it('returns 400 when category is missing', async () => {
      const req = makeReq('/api/vendor-questions', { category: undefined });
      const res = await vendorQuestionsRoute(req);
      expect(res.status).toBe(400);
    });

    it('generates a professional message in demo mode', async () => {
      delete process.env.OPENROUTER_API_KEY;
      const req = makeReq('/api/vendor-questions', {
        category: 'venue',
        vendorName: 'Royal Palace',
        missingInfo: ['Cancellation policy', 'GST included?'],
      });
      const res = await vendorQuestionsRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.demo).toBe(true);
      expect(json.data.message).toContain('Royal Palace');
      expect(json.data.message).toContain('Cancellation policy');
    });
  });
});
