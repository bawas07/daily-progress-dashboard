import { describe, it, expect } from 'vitest';
import { createApp } from '../../../src/app';
import { registerServices } from '../../../src/shared/registry';

describe('App Security Configuration', () => {
  beforeAll(() => {
    registerServices();
  });

  it('should have secure headers enabled', async () => {
    const app = createApp();
    const res = await app.request('/');

    // Check for some common secure headers added by secureHeaders()
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
  });
});
