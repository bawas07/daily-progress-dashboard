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
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

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

    async delete(id: string): Promise<CommitmentLog> {
        return this.prisma.commitmentLog.delete({
            where: { id },
        });
    }
}
