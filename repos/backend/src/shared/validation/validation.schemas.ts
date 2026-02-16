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

// Theme validation
export const themeSchema = z.enum(['auto', 'light', 'dark'], {
  errorMap: () => ({ message: 'Theme must be one of: auto, light, dark' }),
});

// Timezone validation
// Note: For now, we accept any string as timezone. In production, you might want to
// validate against IANA timezone database using a library like 'date-fns-tz' or 'moment-timezone'
export const timezoneSchema = z.string().min(1, 'Timezone is required');

// User preferences update schema
export const updatePreferencesSchema = z.object({
  theme: themeSchema.optional(),
  timezone: timezoneSchema.optional(),
  defaultActiveDays: daysOfWeekSchema.optional(),
  enableNotifications: z.boolean().optional(),
});

// Export type for TypeScript usage
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;


// Commitment schemas
export const createCommitmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  scheduledDays: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
    .min(1, 'At least one scheduled day is required')
    .max(7, 'Cannot schedule more than 7 days'),
});

export const logCommitmentSchema = z.object({
  note: z.string().max(500, 'Note must be less than 500 characters').optional(),
});

export type CreateCommitmentInput = z.infer<typeof createCommitmentSchema>;
export type LogCommitmentInput = z.infer<typeof logCommitmentSchema>;

// Timeline Event schemas
// Note: These schemas are permissive to allow service-level validation
export const createTimelineEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  startTime: z.string().min(1, 'Start time is required'),
  durationMinutes: z.number().optional(),
  recurrencePattern: z.string().optional(),
  daysOfWeek: z.array(z.string()).optional(),
});

export const updateTimelineEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  startTime: z.string().optional(),
  durationMinutes: z.number().optional(),
  recurrencePattern: z.string().optional(),
  daysOfWeek: z.array(z.string()).optional(),
});

export type CreateTimelineEventInput = z.infer<typeof createTimelineEventSchema>;
export type UpdateTimelineEventInput = z.infer<typeof updateTimelineEventSchema>;

// Progress Item schemas
export const importanceSchema = z.enum(['high', 'low'], {
  errorMap: () => ({ message: 'Importance must be either high or low' }),
});

export const urgencySchema = z.enum(['high', 'low'], {
  errorMap: () => ({ message: 'Urgency must be either high or low' }),
});

export const createProgressItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  importance: importanceSchema,
  urgency: urgencySchema,
  activeDays: daysOfWeekSchema.optional(),
  deadline: z.string().datetime().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export const updateProgressItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  importance: importanceSchema.optional(),
  urgency: urgencySchema.optional(),
  activeDays: daysOfWeekSchema.optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(['active', 'settled']).optional(),
  notes: z.string().max(1000).optional(),
});

export const logProgressSchema = z.object({
  note: z.string().max(1000, 'Note must be less than 1000 characters').optional(),
  isOffDay: z.boolean().optional(),
});

export type CreateProgressItemInput = z.infer<typeof createProgressItemSchema>;
export type UpdateProgressItemInput = z.infer<typeof updateProgressItemSchema>;
export type LogProgressInput = z.infer<typeof logProgressSchema>;

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Dashboard query schema
export const dashboardQuerySchema = z.object({
  date: z.string().datetime().optional(),
});

// History query schema
export const historyQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
