import { createMiddleware } from 'hono/factory';
import { createErrorResponse } from '../response/response.helper';
import { ResponseCodes } from '../response/response.types';

interface RateLimitOption {
  windowMs: number;
  max: number;
  keyGenerator?: (c: any) => string;
}

const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiter middleware
 */
export const rateLimit = (options: RateLimitOption) => {
  return createMiddleware(async (c, next) => {
    const key = options.keyGenerator
      ? options.keyGenerator(c)
      : c.req.header('x-forwarded-for') || c.req.header('remote-addr') || 'anonymous';

    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
      memoryStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
    } else {
      record.count++;
      if (record.count > options.max) {
        return c.json(
          createErrorResponse(ResponseCodes.RATE_LIMIT_ERROR, 'Too many requests, please try again later.'),
          429
        );
      }
    }

    await next();
  });
};
