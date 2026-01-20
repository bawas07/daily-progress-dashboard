import { ZodSchema, ZodError } from 'zod';
import { Context, Next } from 'hono';
import { createErrorResponse, validationError } from '../response/response.helper';
import { logger } from '../logger/logger.service';

/**
 * Create a Hono middleware for Zod validation
 *
 * Usage:
 *   app.post('/users', validateRequest(userSchema), userHandler);
 */
export function validateRequest<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    try {
      // Parse request body
      const body = await c.req.json();

      // Validate against schema
      const result = schema.safeParse(body);

      if (!result.success) {
        // Format Zod errors
        const errors: Record<string, string[]> = {};
        const fieldErrors = result.error.flatten().fieldErrors;
        for (const [key, value] of Object.entries(fieldErrors)) {
          errors[key] = Array.isArray(value) ? value : [];
        }

        logger.debug('Validation failed', { errors });
        return c.json(validationError(errors), 400);
      }

      // Store validated data in context
      c.set('validatedData', result.data);

      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        const fieldErrors = error.flatten().fieldErrors;
        for (const [key, value] of Object.entries(fieldErrors)) {
          errors[key] = Array.isArray(value) ? value : [];
        }
        return c.json(validationError(errors), 400);
      }

      logger.error('Validation middleware error', { error });
      return c.json(createErrorResponse('E004', 'Validation error'), 500);
    }
  };
}

/**
 * Validate query parameters with a schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    try {
      const query: Record<string, string> = {};
      const queryParams = c.req.query();
      for (const [key, value] of Object.entries(queryParams)) {
        query[key] = value;
      }

      const result = schema.safeParse(query);

      if (!result.success) {
        const errors: Record<string, string[]> = {};
        const fieldErrors = result.error.flatten().fieldErrors;
        for (const [key, value] of Object.entries(fieldErrors)) {
          errors[key] = Array.isArray(value) ? value : [];
        }
        return c.json(validationError(errors), 400);
      }

      c.set('validatedQuery', result.data);
      await next();
    } catch (error) {
      logger.error('Query validation error', { error });
      return c.json(createErrorResponse('E004', 'Query validation error'), 500);
    }
  };
}
