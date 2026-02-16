import type { ErrorHandler } from 'hono';
import { createErrorResponse, validationError, serverError } from '../response/response.helper';
import { ResponseCodes } from '../response/response.types';
import { logger } from '../logger/logger.service';
import { ZodError } from 'zod';

/**
 * Global error handler middleware for Hono
 *
 * Catches all errors thrown in the application and returns standardized error responses
 *
 * Error Categories:
 * - Validation errors (E001): Zod validation errors, request parsing errors
 * - Authentication errors (E002): JWT errors, unauthorized access
 * - Not found errors (E003): Resource not found, route not found
 * - Server errors (E004): Unexpected errors, database errors
 */
export const errorHandler: ErrorHandler = (err, c) => {
  // Log the error
  logger.error('Error caught by global handler', {
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    const fieldErrors = err.flatten().fieldErrors;
    for (const [key, value] of Object.entries(fieldErrors)) {
      errors[key] = Array.isArray(value) ? value : [];
    }
    return c.json(validationError(errors), 400);
  }

  // Handle JSON parsing errors (including malformed JSON)
  if (err instanceof SyntaxError) {
    return c.json(
      createErrorResponse(
        ResponseCodes.VALIDATION_ERROR,
        'Invalid JSON format',
        { body: ['Invalid JSON in request body'] }
      ),
      400
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return c.json(
      createErrorResponse(
        ResponseCodes.AUTH_ERROR,
        err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token'
      ),
      401
    );
  }

  // Handle known application errors with status codes
  if ('status' in err && typeof err.status === 'number') {
    const statusCode = err.status;
    let errorCode = ResponseCodes.SERVER_ERROR;
    let message = 'An error occurred';

    if (statusCode === 401) {
      errorCode = ResponseCodes.AUTH_ERROR;
      message = 'Unauthorized';
    } else if (statusCode === 404) {
      errorCode = ResponseCodes.NOT_FOUND;
      message = 'Resource not found';
    } else if (statusCode === 400) {
      errorCode = ResponseCodes.VALIDATION_ERROR;
      message = err.message || 'Validation failed';
    }

    return c.json(
      createErrorResponse(errorCode, message),
      statusCode
    );
  }

  // Handle errors with message property
  if (err instanceof Error) {
    // Check for specific error messages
    if (err.message === 'Invalid email or password') {
      return c.json(
        createErrorResponse(ResponseCodes.AUTH_ERROR, 'Invalid email or password'),
        401
      );
    }

    if (err.message === 'Email already registered') {
      return c.json(
        createErrorResponse(ResponseCodes.VALIDATION_ERROR, 'Email already registered'),
        400
      );
    }

    if (err.message === 'User not found') {
      return c.json(
        createErrorResponse(ResponseCodes.NOT_FOUND, 'User not found'),
        404
      );
    }

    if (err.message === 'Invalid refresh token') {
      return c.json(
        createErrorResponse(ResponseCodes.AUTH_ERROR, 'Invalid refresh token'),
        401
      );
    }
  }

  // Default to 500 internal server error for unhandled errors
  return c.json(
    serverError('Internal server error'),
    500
  );
};
