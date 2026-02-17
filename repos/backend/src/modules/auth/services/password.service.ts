/**
 * Validation result type for password strength validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * PasswordService handles password hashing, comparison, and strength validation
 * for the authentication module.
 *
 * Uses Bun's native password hashing (bcrypt) for better compatibility with Bun runtime.
 */
export class PasswordService {
  private static readonly MIN_PASSWORD_LENGTH = 8;
  private static readonly SPECIAL_CHARACTERS = /[!@#$%^&*(),.?":{}|<>]/;

  /**
   * Hashes a password using Bun's native password hashing (bcrypt).
   * @param password - The plain text password to hash
   * @returns A promise resolving to the hashed password
   */
  async hash(password: string): Promise<string> {
    return Bun.password.hash(password);
  }

  /**
   * Compares a plain text password with a hashed password.
   * @param password - The plain text password to verify
   * @param hash - The hashed password to compare against
   * @returns A promise resolving to true if passwords match, false otherwise
   */
  async compare(password: string, hash: string): Promise<boolean> {
    return Bun.password.verify(password, hash);
  }

  /**
   * Validates password strength against security requirements.
   * @param password - The password to validate
   * @returns ValidationResult with valid status and list of errors if any
   */
  validateStrength(password: string): ValidationResult {
    const errors: string[] = [];

    // Check minimum length
    if (password.length < PasswordService.MIN_PASSWORD_LENGTH) {
      errors.push('Password must be at least 8 characters long');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for number
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for special character
    if (!PasswordService.SPECIAL_CHARACTERS.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
