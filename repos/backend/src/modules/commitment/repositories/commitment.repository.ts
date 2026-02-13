import { PrismaClient, Commitment } from '@prisma/client';
import { Container, resolveService } from '../../../shared/container';

export interface CreateCommitmentDto {
    userId: string;
    title: string;
    scheduledDays: string[];
}

export interface UpdateCommitmentDto {
    title?: string;
    scheduledDays?: string[];
}

export class CommitmentRepository {
    private prisma: PrismaClient;

    constructor(container: Container) {
        const databaseService = resolveService<{ client: PrismaClient }>('DatabaseService', container);
        this.prisma = databaseService.client;
    }

    async create(data: CreateCommitmentDto): Promise<Commitment> {
        return this.prisma.commitment.create({
            data: {
                userId: data.userId,
                title: data.title,
                scheduledDays: data.scheduledDays,
            },
        });
    }

    async findById(id: string): Promise<Commitment | null> {
        return this.prisma.commitment.findUnique({
            where: { id },
        });
    }

    async findByUserId(userId: string): Promise<Commitment[]> {
        return this.prisma.commitment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async update(id: string, data: UpdateCommitmentDto): Promise<Commitment> {
        return this.prisma.commitment.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<Commitment> {
        return this.prisma.commitment.delete({
            where: { id },
        });
    }
}
