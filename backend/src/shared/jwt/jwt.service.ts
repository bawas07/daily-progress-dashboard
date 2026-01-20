import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../logger/logger.service';
import { container, HasContainer, Container } from '../container';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  iat?: number;
  exp?: number;
}

export class JwtService implements HasContainer {
  container!: Container;
  private secret: string;
  private defaultExpiresIn = '7d';

  constructor() {
    this.secret = env.JWT_SECRET;
  }

  /**
   * Generate a JWT token
   */
  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const token = jwt.sign(payload, this.secret, {
      expiresIn: this.defaultExpiresIn as jwt.SignOptions['expiresIn'],
    });

    logger.debug('JWT token generated', { sub: payload.sub });
    return token;
  }

  /**
   * Generate a token with custom expiration
   */
  signWithExpiry(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn: string): string {
    return jwt.sign(payload, this.secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
  }

  /**
   * Verify and decode a JWT token
   */
  verify(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('JWT token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.debug('Invalid JWT token');
      } else {
        logger.error('JWT verification error', { error });
      }
      return null;
    }
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

// Register in container
container.register('JwtService', JwtService);
