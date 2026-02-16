import { ZodSchema, ZodError } from 'zod';
import type { Context, Next } from 'hono';
import { createErrorResponse, validationError } from '../response/response.helper';
import { ResponseCodes } from '../response/response.types';
import { logger } from '../logger/logger.service';

/**
 * Format Zod validation errors into a structured format
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  const fieldErrors = error.flatten().fieldErrors;
  for (const [key, value] of Object.entries(fieldErrors)) {
    errors[key] = Array.isArray(value) ? value : [];
  }
  return errors;
}

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
      const body = await c.req.json() as T;

      // Validate against schema
      const result = schema.safeParse(body);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        logger.debug('Validation failed', { errors });
        return c.json(validationError(errors), 400);
      }

      // Store validated data in context
      c.set('validatedData', result.data);

      await next();
    } catch (error: any) {
      // Handle JSON parsing errors
      if (error instanceof SyntaxError || error?.name === 'SyntaxError') {
        logger.debug('Invalid JSON in request body');
        return c.json(
          createErrorResponse(
            ResponseCodes.VALIDATION_ERROR,
            'Invalid JSON format',
            { body: ['Invalid JSON in request body'] }
          ),
          400
        );
      }

      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);
        return c.json(validationError(errors), 400);
      }

      logger.error('Validation middleware error', { error });
      throw error; // Let global error handler handle it
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
        const errors = formatZodErrors(result.error);
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
