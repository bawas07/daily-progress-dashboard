import type { SuccessResponse, ErrorResponse, PaginatedResponse } from './response.types';
import { ResponseCodes } from './response.types';

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  code: `S${string}`,
  message: string,
  data: T
): SuccessResponse<T> {
  return {
    data,
    message,
    code,
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: `E${string}`,
  message: string,
  details?: Record<string, string[]>,
  field?: string
): ErrorResponse {
  return {
    data: {
      details,
      field,
    },
    message,
    code,
  };
}

/**
 * Create a standardized paginated response
 */
export function createPaginatedResponse<T>(
  code: `S${string}`,
  message: string,
  items: T[],
  pagination: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  }
): PaginatedResponse<T> {
  return {
    data: {
      data: items,
      pagination,
    },
    message,
    code,
  };
}

/**
 * Helper to create a not found error response
 */
export function notFound(message: string = 'Resource not found'): ErrorResponse {
  return createErrorResponse(ResponseCodes.NOT_FOUND, message);
}

/**
 * Helper to create a validation error response
 */
export function validationError(
  details: Record<string, string[]>,
  field?: string
): ErrorResponse {
  return createErrorResponse(ResponseCodes.VALIDATION_ERROR, 'Validation failed', details, field);
}

/**
 * Helper to create an unauthorized error response
 */
export function unauthorized(message: string = 'Unauthorized'): ErrorResponse {
  return createErrorResponse(ResponseCodes.AUTH_ERROR, message);
}

/**
 * Helper to create a server error response
 */
export function serverError(message: string = 'Internal server error'): ErrorResponse {
  return createErrorResponse(ResponseCodes.SERVER_ERROR, message);
}
