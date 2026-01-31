
import { Container } from '../../../shared/container';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RefreshToken } from '@prisma/client';
import * as crypto from 'crypto';

export class RefreshTokenService {
    private repository: RefreshTokenRepository;
    private readonly EXPIRES_IN_DAYS = 7;

    constructor(container: Container) {
        this.repository = container.resolve<RefreshTokenRepository>('RefreshTokenRepository');
    }

    async generateRefreshToken(userId: string): Promise<string> {
        const token = crypto.randomBytes(40).toString('hex');
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date(Date.now() + this.EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

        await this.repository.create(userId, tokenHash, expiresAt);

        return token;
    }

    async validateRefreshToken(token: string): Promise<RefreshToken | null> {
        const tokenHash = this.hashToken(token);
        const tokenRecord = await this.repository.findByTokenHash(tokenHash);

        if (!tokenRecord) {
            return null;
        }

        if (tokenRecord.expiresAt < new Date()) {
            return null;
        }

        return tokenRecord;
    }

    async rotateRefreshToken(token: string): Promise<string> {
        const tokenRecord = await this.validateRefreshToken(token);

        if (!tokenRecord) {
            throw new Error('Invalid refresh token');
        }

        // Delete old token (Rotation)
        await this.repository.delete(tokenRecord.id);

        // Generate new token
        return this.generateRefreshToken(tokenRecord.userId);
    }

    // Helper for hashing
    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}
