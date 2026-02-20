/**
 * Settings Module Types
 */

/**
 * Day of week enum for active days selection
 */
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

/**
 * Theme options
 */
export type ThemeOption = 'auto' | 'light' | 'dark'

/**
 * Preferences form data
 */
export interface PreferencesFormData {
  defaultActiveDays: DayOfWeek[]
  theme: ThemeOption
  timezone: string
  enableNotifications: boolean
}

/**
 * Password change form data
 */
export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}
