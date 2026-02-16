import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { rateLimit } from '../../../../src/shared/middleware/rate-limit.middleware';

describe('rateLimit middleware', () => {
  beforeEach(() => {
    // We can't easily clear the memoryStore in the middleware because it's not exported
    // For testing purposes, we might want to export it or use a different approach
    // But since it's a simple Map, we can try to find it or just use different keys
  });

  it('should allow requests within the limit', async () => {
    const app = new Hono();
    const limit = 2;
    app.use('/test', rateLimit({ windowMs: 10000, max: limit }));
    app.get('/test', (c) => c.text('OK'));

    const res1 = await app.request('/test', { headers: { 'x-forwarded-for': '1.2.3.4' } });
    expect(res1.status).toBe(200);

    const res2 = await app.request('/test', { headers: { 'x-forwarded-for': '1.2.3.4' } });
    expect(res2.status).toBe(200);
  });

  it('should block requests exceeding the limit', async () => {
    const app = new Hono();
    const limit = 2;
    // Use a unique IP to avoid interference with other tests
    const ip = '1.2.3.5';
    app.use('/test-blocked', rateLimit({ windowMs: 10000, max: limit }));
    app.get('/test-blocked', (c) => c.text('OK'));

    // Request 1
    await app.request('/test-blocked', { headers: { 'x-forwarded-for': ip } });
    // Request 2
    await app.request('/test-blocked', { headers: { 'x-forwarded-for': ip } });
    // Request 3 - should be blocked
    const res3 = await app.request('/test-blocked', { headers: { 'x-forwarded-for': ip } });

    expect(res3.status).toBe(429);
    const json = await res3.json();
    expect(json.code).toBe('E429');
    expect(json.message).toBe('Too many requests, please try again later.');
  });

  it('should use custom key generator if provided', async () => {
    const app = new Hono();
    const keyGenerator = vi.fn().mockReturnValue('custom-key');
    app.use('/test-custom', rateLimit({ windowMs: 10000, max: 1, keyGenerator }));
    app.get('/test-custom', (c) => c.text('OK'));

    await app.request('/test-custom');
    expect(keyGenerator).toHaveBeenCalled();

    const res2 = await app.request('/test-custom');
    expect(res2.status).toBe(429);
  });
});
