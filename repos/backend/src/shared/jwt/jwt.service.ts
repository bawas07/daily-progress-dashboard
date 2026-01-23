import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../logger/logger.service';
import type { HasContainer, Container } from '../container';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Result of JWT verification with typed result
 */
export type JwtVerifyResult =
  | { valid: true; payload: JwtPayload }
  | { valid: false; reason: 'expired' | 'invalid' | 'error' };

export class JwtService implements HasContainer {
  container!: Container;
  private secret: string;
  private defaultExpiresIn = '7d';
  private algorithm: jwt.Algorithm = 'HS256';

  constructor() {
    this.secret = env.JWT_SECRET;
  }

  /**
   * Generate a JWT token
   */
  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const token = jwt.sign(payload, this.secret, {
      expiresIn: this.defaultExpiresIn as jwt.SignOptions['expiresIn'],
      algorithm: this.algorithm,
    });

    logger.debug('JWT token generated', { sub: payload.sub });
    return token;
  }

  /**
   * Generate a token with custom expiration
   */
  signWithExpiry(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn: string): string {
    return jwt.sign(payload, this.secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'], algorithm: this.algorithm });
  }

  /**
   * Verify and decode a JWT token
   */
  verify(token: string): JwtVerifyResult {
    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: [this.algorithm] }) as JwtPayload;
      return { valid: true, payload: decoded };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('JWT token expired');
        return { valid: false, reason: 'expired' };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        logger.debug('Invalid JWT token');
        return { valid: false, reason: 'invalid' };
      }
      // Unexpected error
      logger.error('JWT verification error', { error });
      return { valid: false, reason: 'error' };
    }
  }

  /**
   * Legacy verify method for backward compatibility
   * @deprecated Use verify() instead which returns typed result
   */
  verifyOld(token: string): JwtPayload | null {
    const result = this.verify(token);
    return result.valid ? result.payload : null;
  }

  /**
   * Decode token without verification (for debugging)
   */
  decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
