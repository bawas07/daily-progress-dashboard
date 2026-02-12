import { PrismaClient, ProgressLog, Prisma } from '@prisma/client';
import { DatabaseService } from '../../../shared/database/database.service';
import { Container } from '../../../shared/container';

export class ProgressLogRepository {
    private prisma: PrismaClient;

    constructor(container: Container) {
        const dbService = container.resolve<DatabaseService>('DatabaseService');
        this.prisma = dbService.client;
    }

    async create(data: Prisma.ProgressLogUncheckedCreateInput): Promise<ProgressLog> {
        return this.prisma.progressLog.create({
            data,
        });
    }

    async findByItemId(progressItemId: string, options?: { skip?: number; take?: number }): Promise<ProgressLog[]> {
        return this.prisma.progressLog.findMany({
            where: { progressItemId },
            orderBy: { loggedAt: 'desc' },
            skip: options?.skip,
            take: options?.take,
        });
    }

    async countByItemId(progressItemId: string): Promise<number> {
        return this.prisma.progressLog.count({
            where: { progressItemId },
        });
    }

    async findByDate(userId: string, start: Date, end: Date): Promise<ProgressLog[]> {
        return this.prisma.progressLog.findMany({
            where: {
                progressItem: {
                    userId,
                },
                loggedAt: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: { loggedAt: 'desc' },
            include: {
                progressItem: true,
            },
        });
    }
}
