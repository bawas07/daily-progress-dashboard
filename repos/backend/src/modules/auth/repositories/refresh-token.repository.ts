
import { Container } from '../../../shared/container';
import { PrismaClient } from '@prisma/client';

export class RefreshTokenRepository {
    private prisma: PrismaClient;

    constructor(container: Container) {
        // We use 'any' cast here to work around the mock container injection in tests
        const dbService = container.resolve('DatabaseService') as any;
        this.prisma = dbService.client;
    }

    async create(userId: string, tokenHash: string, expiresAt: Date) {
        return this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt
            }
        });
    }

    async findByTokenHash(tokenHash: string) {
        return this.prisma.refreshToken.findUnique({
            where: { tokenHash }
        });
    }

    async delete(id: string) {
        return this.prisma.refreshToken.delete({
            where: { id }
        });
    }

    async deleteAllForUser(userId: string) {
        return this.prisma.refreshToken.deleteMany({
            where: { userId }
        });
    }

    async deleteExpired() {
        return this.prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
    }
}
