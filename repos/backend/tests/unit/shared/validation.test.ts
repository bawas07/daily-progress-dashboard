import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  themeSchema,
  timezoneSchema,
  updatePreferencesSchema,
  dayOfWeekSchema,
  daysOfWeekSchema,
} from '@/shared/validation/validation.schemas';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('accepts valid email addresses', () => {
      const result1 = emailSchema.safeParse('user@example.com');
      expect(result1.success).toBe(true);

      const result2 = emailSchema.safeParse('test.user+tag@domain.co.uk');
      expect(result2.success).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      const result1 = emailSchema.safeParse('not-an-email');
      expect(result1.success).toBe(false);
      if (!result1.success) {
        expect(result1.error.errors[0].message).toBe('Invalid email format');
      }

      const result2 = emailSchema.safeParse('missing@domain');
      expect(result2.success).toBe(false);

      const result3 = emailSchema.safeParse('@nodomain.com');
      expect(result3.success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('accepts valid passwords', () => {
      const result = passwordSchema.safeParse('Password123');
      expect(result.success).toBe(true);
    });

    it('rejects passwords without 8 characters minimum', () => {
      const result = passwordSchema.safeParse('Pass1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 8 characters');
      }
    });

    it('rejects passwords without uppercase letter', () => {
      const result = passwordSchema.safeParse('password123');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('uppercase letter');
      }
    });

    it('rejects passwords without number', () => {
      const result = passwordSchema.safeParse('Password');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('number');
      }
    });
  });

  describe('nameSchema', () => {
    it('accepts valid names', () => {
      const result = nameSchema.safeParse('John Doe');
      expect(result.success).toBe(true);
    });

    it('rejects names shorter than 2 characters', () => {
      const result = nameSchema.safeParse('J');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 2 characters');
      }
    });

    it('rejects names longer than 100 characters', () => {
      const result = nameSchema.safeParse('A'.repeat(101));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('less than 100 characters');
      }
    });
  });

  describe('dayOfWeekSchema', () => {
    const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    it('accepts all valid day abbreviations', () => {
      validDays.forEach((day) => {
        const result = dayOfWeekSchema.safeParse(day);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid day names', () => {
      const result1 = dayOfWeekSchema.safeParse('monday');
      expect(result1.success).toBe(false);

      const result2 = dayOfWeekSchema.safeParse('xyz');
      expect(result2.success).toBe(false);

      const result3 = dayOfWeekSchema.safeParse('MON'); // case-sensitive
      expect(result3.success).toBe(false);
    });
  });

  describe('daysOfWeekSchema', () => {
    it('accepts non-empty arrays of valid days', () => {
      const result1 = daysOfWeekSchema.safeParse(['mon', 'wed', 'fri']);
      expect(result1.success).toBe(true);

      const result2 = daysOfWeekSchema.safeParse(['mon']);
      expect(result2.success).toBe(true);
    });

    it('rejects empty arrays', () => {
      const result = daysOfWeekSchema.safeParse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('At least one day is required');
      }
    });

    it('rejects arrays with invalid day names', () => {
      const result = daysOfWeekSchema.safeParse(['mon', 'xyz', 'fri']);
      expect(result.success).toBe(false);
    });
  });

  describe('themeSchema', () => {
    it('accepts valid theme values', () => {
      const validThemes = ['auto', 'light', 'dark'];

      validThemes.forEach((theme) => {
        const result = themeSchema.safeParse(theme);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid theme values', () => {
      const result = themeSchema.safeParse('blue');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Theme must be one of: auto, light, dark');
      }
    });

    it('rejects case-sensitive variations', () => {
      const result1 = themeSchema.safeParse('LIGHT');
      expect(result1.success).toBe(false);

      const result2 = themeSchema.safeParse('Dark');
      expect(result2.success).toBe(false);
    });
  });

  describe('timezoneSchema', () => {
    it('accepts any non-empty string', () => {
      const result1 = timezoneSchema.safeParse('UTC');
      expect(result1.success).toBe(true);

      const result2 = timezoneSchema.safeParse('America/New_York');
      expect(result2.success).toBe(true);

      const result3 = timezoneSchema.safeParse('Europe/London');
      expect(result3.success).toBe(true);
    });

    it('rejects empty strings', () => {
      const result = timezoneSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Timezone is required');
      }
    });
  });

  describe('updatePreferencesSchema', () => {
    describe('valid inputs', () => {
      it('accepts partial updates with theme only', () => {
        const result = updatePreferencesSchema.safeParse({
          theme: 'dark',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ theme: 'dark' });
        }
      });

      it('accepts partial updates with timezone only', () => {
        const result = updatePreferencesSchema.safeParse({
          timezone: 'America/Los_Angeles',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ timezone: 'America/Los_Angeles' });
        }
      });

      it('accepts partial updates with defaultActiveDays only', () => {
        const result = updatePreferencesSchema.safeParse({
          defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          });
        }
      });

      it('accepts partial updates with enableNotifications only', () => {
        const result = updatePreferencesSchema.safeParse({
          enableNotifications: false,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ enableNotifications: false });
        }
      });

      it('accepts complete updates with all fields', () => {
        const result = updatePreferencesSchema.safeParse({
          theme: 'light',
          timezone: 'Europe/Paris',
          defaultActiveDays: ['mon', 'wed', 'fri'],
          enableNotifications: true,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            theme: 'light',
            timezone: 'Europe/Paris',
            defaultActiveDays: ['mon', 'wed', 'fri'],
            enableNotifications: true,
          });
        }
      });

      it('accepts empty object (no changes)', () => {
        const result = updatePreferencesSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({});
        }
      });

      it('accepts multiple field updates', () => {
        const result = updatePreferencesSchema.safeParse({
          theme: 'auto',
          enableNotifications: false,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            theme: 'auto',
            enableNotifications: false,
          });
        }
      });
    });

    describe('invalid inputs', () => {
      it('rejects invalid theme value', () => {
        const result = updatePreferencesSchema.safeParse({
          theme: 'invalid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const themeError = result.error.errors.find((e) => e.path[0] === 'theme');
          expect(themeError?.message).toBe('Theme must be one of: auto, light, dark');
        }
      });

      it('rejects empty timezone string', () => {
        const result = updatePreferencesSchema.safeParse({
          timezone: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const timezoneError = result.error.errors.find((e) => e.path[0] === 'timezone');
          expect(timezoneError?.message).toBe('Timezone is required');
        }
      });

      it('rejects empty array for defaultActiveDays', () => {
        const result = updatePreferencesSchema.safeParse({
          defaultActiveDays: [],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const daysError = result.error.errors.find((e) => e.path[0] === 'defaultActiveDays');
          expect(daysError?.message).toContain('At least one day is required');
        }
      });

      it('rejects array with invalid day names for defaultActiveDays', () => {
        const result = updatePreferencesSchema.safeParse({
          defaultActiveDays: ['mon', 'xyz', 'fri'],
        });
        expect(result.success).toBe(false);
      });

      it('rejects non-boolean enableNotifications', () => {
        const result = updatePreferencesSchema.safeParse({
          enableNotifications: 'true',
        });
        expect(result.success).toBe(false);
      });

      it('reports multiple validation errors', () => {
        const result = updatePreferencesSchema.safeParse({
          theme: 'invalid',
          timezone: '',
          defaultActiveDays: [],
          enableNotifications: 'not-a-boolean',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          // Should have errors for all fields
          const fields = result.error.errors.map((e) => e.path[0]);
          expect(fields).toContain('theme');
          expect(fields).toContain('timezone');
          expect(fields).toContain('defaultActiveDays');
          expect(fields).toContain('enableNotifications');
        }
      });

      it('rejects invalid day names in defaultActiveDays with clear error', () => {
        const result = updatePreferencesSchema.safeParse({
          defaultActiveDays: ['monday', 'tuesday'],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const daysError = result.error.errors.find((e) => e.path[0] === 'defaultActiveDays');
          expect(daysError).toBeDefined();
        }
      });
    });

    describe('edge cases', () => {
      it('accepts single day in defaultActiveDays', () => {
        const result = updatePreferencesSchema.safeParse({
          defaultActiveDays: ['mon'],
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.defaultActiveDays).toEqual(['mon']);
        }
      });

      it('accepts all seven days in defaultActiveDays', () => {
        const result = updatePreferencesSchema.safeParse({
          defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.defaultActiveDays).toHaveLength(7);
        }
      });

      it('handles mixed valid updates with invalid field', () => {
        const result = updatePreferencesSchema.safeParse({
          theme: 'dark', // valid
          timezone: 'UTC', // valid
          defaultActiveDays: [], // invalid - empty array
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          // Should have error for defaultActiveDays
          const daysError = result.error.errors.find((e) => e.path[0] === 'defaultActiveDays');
          expect(daysError).toBeDefined();
        }
      });
    });
  });
});
