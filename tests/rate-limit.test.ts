import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, getClientIp } from '../src/lib/rate-limit';

describe('Rate Limiter (src/lib/rate-limit.ts)', () => {
  it('allows requests within the limit and decrements remaining count', () => {
    const ip = '192.168.1.100';
    const first = checkRateLimit(ip, 5, 60000);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(4);

    const second = checkRateLimit(ip, 5, 60000);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(3);
  });

  it('blocks requests once limit is reached', () => {
    const ip = '192.168.1.101';
    for (let i = 0; i < 3; i++) {
      const res = checkRateLimit(ip, 3, 60000);
      expect(res.allowed).toBe(true);
    }
    const blocked = checkRateLimit(ip, 3, 60000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('resets limit once window expires', () => {
    const ip = '192.168.1.102';
    // Expired window (windowMs = -100)
    checkRateLimit(ip, 2, -100);
    const afterExpire = checkRateLimit(ip, 2, 60000);
    expect(afterExpire.allowed).toBe(true);
    expect(afterExpire.remaining).toBe(1);
  });

  describe('getClientIp', () => {
    it('extracts first IP from x-forwarded-for header', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
      });
      expect(getClientIp(req)).toBe('203.0.113.195');
    });

    it('extracts IP from x-real-ip if x-forwarded-for is missing', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '198.51.100.1' },
      });
      expect(getClientIp(req)).toBe('198.51.100.1');
    });

    it('falls back to 127.0.0.1 when no proxy headers are present', () => {
      const req = new Request('http://localhost');
      expect(getClientIp(req)).toBe('127.0.0.1');
    });
  });
});
