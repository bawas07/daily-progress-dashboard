import { describe, it, expect, beforeEach } from 'vitest';
import { PasswordService } from '../../../src/modules/auth/services/password.service';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hash', () => {
    it('should successfully hash a password', async () => {
      const password = 'TestPassword123';
      const result = await passwordService.hash(password);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // bcrypt hashes are typically 60 characters
      expect(result.length).toBe(60);
    });

    it('should generate different hashes for the same password due to salt', async () => {
      const password = 'TestPassword123';

      const hash1 = await passwordService.hash(password);
      const hash2 = await passwordService.hash(password);

      expect(hash1).not.toBe(hash2);
      expect(hash1.length).toBe(60);
      expect(hash2.length).toBe(60);
    });
  });

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123';
      const hash = await passwordService.hash(password);

      const result = await passwordService.compare(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const hash = await passwordService.hash(password);

      const result = await passwordService.compare(wrongPassword, hash);

      expect(result).toBe(false);
    });
  });

  describe('validateStrength', () => {
    it('should validate a valid password successfully', () => {
      const password = 'ValidPass1!';
      const result = passwordService.validateStrength(password);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for password shorter than 8 characters', () => {
      const password = 'Short1';
      const result = passwordService.validateStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should fail for password missing uppercase letter', () => {
      const password = 'lowercase123';
      const result = passwordService.validateStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should fail for password missing lowercase letter', () => {
      const password = 'UPPERCASE123';
      const result = passwordService.validateStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should fail for password missing number', () => {
      const password = 'NoNumbersHere';
      const result = passwordService.validateStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should fail for password missing special character', () => {
      const password = 'Password123';
      const result = passwordService.validateStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should fail for empty password', () => {
      const password = '';
      const result = passwordService.validateStrength(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });
  });
});
