/**
 * Standardized API Response Types
 *
 * All API responses follow this format:
 * - Success: { data: T, message: string, code: string }
 * - Error: { data: { details?: any, field?: string }, message: string, code: string }
 */

// Base response structure
export interface ApiResponse<T = any> {
  data: T;
  message: string;
  code: string;
}

// Success response (code starts with 'S')
export interface SuccessResponse<T> extends ApiResponse<T> {
  code: `S${string}`;
}

// Error response (code starts with 'E')
export interface ErrorResponse extends ApiResponse<{
  details?: Record<string, string[]>;
  field?: string;
}> {
  code: `E${string}`;
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<{
  data: T[];
  pagination: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
}> {
  code: `S${string}`;
}

// Response codes
export const ResponseCodes = {
  // Success codes
  SUCCESS: 'S001',
  CREATED: 'S002',
  UPDATED: 'S003',
  DELETED: 'S004',

  // Error codes
  VALIDATION_ERROR: 'E001',
  AUTH_ERROR: 'E002',
  NOT_FOUND: 'E003',
  SERVER_ERROR: 'E004',
} as const;

export type ResponseCode = typeof ResponseCodes[keyof typeof ResponseCodes];
