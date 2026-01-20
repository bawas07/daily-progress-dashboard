import type { SuccessResponse, ErrorResponse, PaginatedResponse } from './response.types';

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
  data: T[],
  pagination: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  }
): PaginatedResponse<T> {
  return {
    data: {
      data,
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
  return createErrorResponse('E003', message);
}

/**
 * Helper to create a validation error response
 */
export function validationError(
  details: Record<string, string[]>,
  field?: string
): ErrorResponse {
  return createErrorResponse('E001', 'Validation failed', details, field);
}

/**
 * Helper to create an unauthorized error response
 */
export function unauthorized(message: string = 'Unauthorized'): ErrorResponse {
  return createErrorResponse('E002', message);
}

/**
 * Helper to create a server error response
 */
export function serverError(message: string = 'Internal server error'): ErrorResponse {
  return createErrorResponse('E004', message);
}
