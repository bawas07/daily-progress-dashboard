import { PrismaClient, CommitmentLog } from '@prisma/client';
import { Container, resolveService } from '../../../shared/container';

export interface CreateCommitmentLogDto {
    commitmentId: string;
    completedAt?: Date;
    note?: string;
}

export class CommitmentLogRepository {
    private prisma: PrismaClient;

    constructor(container: Container) {
        const databaseService = resolveService<{ client: PrismaClient }>('DatabaseService', container);
        this.prisma = databaseService.client;
    }

    async create(data: CreateCommitmentLogDto): Promise<CommitmentLog> {
        return this.prisma.commitmentLog.create({
            data: {
                commitmentId: data.commitmentId,
                completedAt: data.completedAt || new Date(),
                note: data.note,
            },
        });
    }

    async findByCommitmentId(commitmentId: string): Promise<CommitmentLog[]> {
        return this.prisma.commitmentLog.findMany({
            where: { commitmentId },
            orderBy: { completedAt: 'desc' },
        });
    }

    async countByCommitmentIdAndDate(commitmentId: string, date: Date): Promise<number> {
        // Create date boundaries in UTC to avoid timezone issues
        const dateStr = date.toISOString().split('T')[0]; // Get YYYY-MM-DD in UTC
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        return this.prisma.commitmentLog.count({
            where: {
                commitmentId,
                completedAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });
    }

    async findByDateRange(userId: string, start: Date, end: Date): Promise<CommitmentLog[]> {
        return this.prisma.commitmentLog.findMany({
            where: {
                commitment: {
                    userId,
                },
                completedAt: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: { completedAt: 'desc' },
            include: {
                commitment: true,
            },
        });
    }

    async delete(id: string): Promise<CommitmentLog> {
        return this.prisma.commitmentLog.delete({
            where: { id },
        });
    }
}
