import { UserPreferencesRepository, UpdatePreferencesData } from '../../auth/repositories/user.preferences.repository';
import { Container, resolveService } from '../../../shared/container';

/**
 * Custom error class for validation failures
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Valid theme options
 */
const VALID_THEMES = ['auto', 'light', 'dark'] as const;
export type Theme = typeof VALID_THEMES[number];

/**
 * Valid day abbreviations
 */
const VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayAbbreviation = typeof VALID_DAYS[number];

/**
 * User preferences interface
 */
export interface UserPreferencesData {
  defaultActiveDays: string[];
  theme: string;
  timezone: string;
  enableNotifications: boolean;
}

/**
 * Extended update data with validation
 */
export interface UpdateUserPreferencesData {
  defaultActiveDays?: string[];
  theme?: Theme;
  timezone?: string;
  enableNotifications?: boolean;
}

/**
 * UserPreferencesService
 *
 * Handles user preferences business logic including validation
 */
export class UserPreferencesService {
  private preferencesRepository: UserPreferencesRepository;

  /**
   * Constructor accepting dependencies directly (for testing) or via Container (for production)
   *
   * @param containerOrRepository - Either a Container instance (production) or UserPreferencesRepository (testing)
   */
  constructor(containerOrRepository: Container | UserPreferencesRepository) {
    if (containerOrRepository instanceof Container) {
      // Production: use container to resolve dependencies
      this.preferencesRepository = resolveService<UserPreferencesRepository>(
        'UserPreferencesRepository',
        containerOrRepository
      );
    } else {
      // Testing: use provided dependencies directly
      this.preferencesRepository = containerOrRepository;
    }
  }

  /**
   * Get user preferences, creating defaults if none exist
   * @param userId - User ID to fetch preferences for
   * @returns User preferences data (creates defaults if none exist)
   * @throws {Error} If database operation fails
   */
  async getPreferences(userId: string): Promise<UserPreferencesData> {
    let preferences = await this.preferencesRepository.findByUserId(userId);

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await this.preferencesRepository.create(userId);
    }

    return {
      defaultActiveDays: preferences.defaultActiveDays as string[],
      theme: preferences.theme,
      timezone: preferences.timezone,
      enableNotifications: preferences.enableNotifications,
    };
  }

  /**
   * Update user preferences with validation
   * Validates theme, timezone, and defaultActiveDays before updating
   * @param userId - User ID to update preferences for
   * @param data - Partial preferences data to update
   * @returns Updated user preferences data
   * @throws {ValidationError} If validation fails (theme, timezone, or days)
   * @throws {Error} If database operation fails
   */
  async updatePreferences(
    userId: string,
    data: UpdateUserPreferencesData
  ): Promise<UserPreferencesData> {
    // Validate theme if provided
    if (data.theme !== undefined && !this.isValidTheme(data.theme)) {
      throw new ValidationError(
        `Invalid theme value. Must be one of: ${VALID_THEMES.join(', ')}`
      );
    }

    // Validate timezone if provided
    if (data.timezone !== undefined && !this.isValidTimezone(data.timezone)) {
      throw new ValidationError(
        'Invalid timezone. Must be a valid IANA timezone identifier'
      );
    }

    // Validate defaultActiveDays if provided
    if (data.defaultActiveDays !== undefined) {
      this.validateDefaultActiveDays(data.defaultActiveDays);
    }

    // Update preferences
    const updatedPreferences = await this.preferencesRepository.update(
      userId,
      data as UpdatePreferencesData
    );

    return {
      defaultActiveDays: updatedPreferences.defaultActiveDays as string[],
      theme: updatedPreferences.theme,
      timezone: updatedPreferences.timezone,
      enableNotifications: updatedPreferences.enableNotifications,
    };
  }

  /**
   * Validate theme value
   * @param theme - Theme value to validate
   * @returns True if theme is valid (auto, light, or dark)
   */
  private isValidTheme(theme: string): theme is Theme {
    return VALID_THEMES.includes(theme as Theme);
  }

  /**
   * Validate IANA timezone string
   * Uses Intl API to verify timezone is recognized
   * @param timezone - Timezone string to validate (e.g., "America/New_York")
   * @returns True if timezone is a valid IANA identifier
   * @throws Does not throw - returns boolean for validation logic
   */
  private isValidTimezone(timezone: string): boolean {
    if (!timezone || timezone.trim() === '') {
      return false;
    }

    try {
      // Use Intl.DateTimeFormat to check if timezone is valid
      // This will throw an error for invalid timezones
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate defaultActiveDays array
   * Performs comprehensive validation including:
   * - Empty array check
   * - Duplicate day detection
   * - Invalid day abbreviation detection
   * @param days - Array of day abbreviations to validate
   * @throws {ValidationError} If validation fails with descriptive message
   */
  private validateDefaultActiveDays(days: string[]): void {
    // Check if array is empty
    if (days.length === 0) {
      throw new ValidationError('defaultActiveDays cannot be empty');
    }

    // Check for duplicate days
    const uniqueDays = new Set(days);
    if (uniqueDays.size !== days.length) {
      throw new ValidationError('Duplicate day abbreviations are not allowed');
    }

    // Validate each day abbreviation
    for (const day of days) {
      if (!VALID_DAYS.includes(day as DayAbbreviation)) {
        throw new ValidationError(
          `Invalid day abbreviation. Must be one of: ${VALID_DAYS.join(', ')}`
        );
      }
    }
  }
}
