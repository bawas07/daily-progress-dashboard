import { z } from 'zod';

/**
 * Common validation schemas used across the application
 */

// Email validation
export const emailSchema = z.string().email('Invalid email format');

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Name validation
export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters');

// Pagination query schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Day of week validation
export const dayOfWeekSchema = z.enum([
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
]);

// Array of days validation
export const daysOfWeekSchema = z.array(dayOfWeekSchema).min(1, 'At least one day is required');

// Login request schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Register request schema
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

// Pagination schema export
export type PaginationInput = z.infer<typeof paginationSchema>;
