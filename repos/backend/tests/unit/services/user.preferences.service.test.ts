import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserPreferencesService, ValidationError } from '../../../src/modules/user-preferences/services/user.preferences.service';
import { UserPreferencesRepository } from '../../../src/modules/auth/repositories/user.preferences.repository';
import { UserPreferences } from '@prisma/client';

describe('UserPreferencesService', () => {
  let mockRepository: UserPreferencesRepository;
  let service: UserPreferencesService;

  const mockPreferences: UserPreferences = {
    userId: 'user-123',
    defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    theme: 'auto',
    timezone: 'UTC',
    enableNotifications: true,
  };

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    } as unknown as UserPreferencesRepository;

    // Create service with mocked repository directly
    // The service constructor accepts either Container or UserPreferencesRepository directly
    service = new UserPreferencesService(mockRepository as UserPreferencesRepository);
  });

  describe('getPreferences', () => {
    it('should return user preferences when they exist', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(mockPreferences);

      const result = await service.getPreferences('user-123');

      expect(result).toEqual({
        defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        theme: 'auto',
        timezone: 'UTC',
        enableNotifications: true,
      });
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should create default preferences when none exist', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(mockPreferences);

      const result = await service.getPreferences('user-123');

      expect(result).toEqual({
        defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        theme: 'auto',
        timezone: 'UTC',
        enableNotifications: true,
      });
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123');
      expect(mockRepository.create).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updatePreferences', () => {
    it('should successfully update all preference fields', async () => {
      const updateData = {
        defaultActiveDays: ['mon', 'wed', 'fri'],
        theme: 'dark' as const,
        timezone: 'America/New_York',
        enableNotifications: false,
      };

      const updatedPreferences: UserPreferences = {
        ...mockPreferences,
        ...updateData,
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedPreferences);

      const result = await service.updatePreferences('user-123', updateData);

      expect(result).toEqual({
        defaultActiveDays: ['mon', 'wed', 'fri'],
        theme: 'dark',
        timezone: 'America/New_York',
        enableNotifications: false,
      });
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', updateData);
    });

    it('should successfully update partial preferences', async () => {
      const updateData = {
        theme: 'light' as const,
      };

      const updatedPreferences: UserPreferences = {
        ...mockPreferences,
        theme: 'light',
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedPreferences);

      const result = await service.updatePreferences('user-123', updateData);

      expect(result).toEqual({
        defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        theme: 'light',
        timezone: 'UTC',
        enableNotifications: true,
      });
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', updateData);
    });

    it('should accept valid theme values', async () => {
      const validThemes = ['auto', 'light', 'dark'] as const;

      for (const theme of validThemes) {
        const updateData = { theme: theme as 'auto' | 'light' | 'dark' };
        const updatedPreferences: UserPreferences = {
          ...mockPreferences,
          theme: theme,
        };

        vi.mocked(mockRepository.update).mockResolvedValue(updatedPreferences);

        const result = await service.updatePreferences('user-123', updateData);

        expect(result.theme).toBe(theme);
        expect(mockRepository.update).toHaveBeenCalledWith('user-123', updateData);
      }
    });

    it('should reject invalid theme value', async () => {
      const updateData = {
        theme: 'invalid-theme' as any,
      };

      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(ValidationError);
      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(
        'Invalid theme value. Must be one of: auto, light, dark'
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should accept valid IANA timezone strings', async () => {
      const validTimezones = [
        'UTC',
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
      ];

      for (const timezone of validTimezones) {
        const updateData = { timezone };
        const updatedPreferences: UserPreferences = {
          ...mockPreferences,
          timezone,
        };

        vi.mocked(mockRepository.update).mockClear().mockResolvedValue(updatedPreferences);

        const result = await service.updatePreferences('user-123', updateData);

        expect(result.timezone).toBe(timezone);
        expect(mockRepository.update).toHaveBeenCalledWith('user-123', updateData);
      }
    });

    it('should reject invalid timezone string', async () => {
      const updateData = {
        timezone: 'Invalid/Timezone',
      };

      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(ValidationError);
      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(
        'Invalid timezone. Must be a valid IANA timezone identifier'
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should reject empty timezone string', async () => {
      const updateData = {
        timezone: '',
      };

      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(ValidationError);
      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(
        'Invalid timezone. Must be a valid IANA timezone identifier'
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should accept valid day abbreviations', async () => {
      const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const updateData = {
        defaultActiveDays: validDays,
      };

      const updatedPreferences: UserPreferences = {
        ...mockPreferences,
        defaultActiveDays: validDays,
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedPreferences);

      const result = await service.updatePreferences('user-123', updateData);

      expect(result.defaultActiveDays).toEqual(validDays);
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', updateData);
    });

    it('should accept subset of valid days', async () => {
      const updateData = {
        defaultActiveDays: ['mon', 'wed', 'fri'],
      };

      const updatedPreferences: UserPreferences = {
        ...mockPreferences,
        defaultActiveDays: ['mon', 'wed', 'fri'],
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedPreferences);

      const result = await service.updatePreferences('user-123', updateData);

      expect(result.defaultActiveDays).toEqual(['mon', 'wed', 'fri']);
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', updateData);
    });

    it('should reject invalid day abbreviation', async () => {
      const updateData = {
        defaultActiveDays: ['mon', 'tue', 'invalid-day'],
      };

      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(ValidationError);
      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(
        'Invalid day abbreviation. Must be one of: mon, tue, wed, thu, fri, sat, sun'
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should reject empty day abbreviation', async () => {
      const updateData = {
        defaultActiveDays: ['mon', 'tue', ''],
      };

      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(ValidationError);
      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(
        'Invalid day abbreviation. Must be one of: mon, tue, wed, thu, fri, sat, sun'
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should reject day abbreviation with wrong case', async () => {
      const updateData = {
        defaultActiveDays: ['MON', 'tue', 'wed'],
      };

      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(ValidationError);
      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(
        'Invalid day abbreviation. Must be one of: mon, tue, wed, thu, fri, sat, sun'
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should reject empty array for defaultActiveDays', async () => {
      const updateData = {
        defaultActiveDays: [],
      };

      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(ValidationError);
      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(
        'defaultActiveDays cannot be empty'
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should reject duplicate day abbreviations', async () => {
      const updateData = {
        defaultActiveDays: ['mon', 'tue', 'mon', 'wed'],
      };

      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(ValidationError);
      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(
        'Duplicate day abbreviations are not allowed'
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should handle multiple validation errors', async () => {
      const updateData = {
        theme: 'invalid' as any,
        timezone: 'Invalid/Timezone',
        defaultActiveDays: ['mon', 'invalid-day'],
      };

      await expect(service.updatePreferences('user-123', updateData)).rejects.toThrow(ValidationError);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should update enableNotifications boolean field', async () => {
      const updateData = {
        enableNotifications: false,
      };

      const updatedPreferences: UserPreferences = {
        ...mockPreferences,
        enableNotifications: false,
      };

      vi.mocked(mockRepository.update).mockResolvedValue(updatedPreferences);

      const result = await service.updatePreferences('user-123', updateData);

      expect(result.enableNotifications).toBe(false);
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', updateData);
    });
  });
});
