import { PrismaClient, ProgressItem, Prisma } from '@prisma/client';
import { DatabaseService } from '../../../shared/database/database.service';
import { Container } from '../../../shared/container';

export class ProgressItemRepository {
    private prisma: PrismaClient;

    constructor(container: Container) {
        const dbService = container.resolve<DatabaseService>('DatabaseService');
        this.prisma = dbService.client;
    }

    async create(data: Prisma.ProgressItemUncheckedCreateInput): Promise<ProgressItem> {
        return this.prisma.progressItem.create({
            data: {
                ...data,
                status: 'active',
            },
        });
    }

    async findById(id: string): Promise<ProgressItem | null> {
        return this.prisma.progressItem.findUnique({
            where: { id },
        });
    }

    async findAll(
        userId: string,
        options?: { activeDay?: string; skip?: number; take?: number }
    ): Promise<ProgressItem[]> {
        const where: Prisma.ProgressItemWhereInput = {
            userId,
            status: 'active',
        };

        if (options?.activeDay) {
            where.activeDays = {
                array_contains: options.activeDay,
            };
        }

        return this.prisma.progressItem.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            skip: options?.skip,
            take: options?.take,
        });
    }

    async count(userId: string, options?: { activeDay?: string }): Promise<number> {
        const where: Prisma.ProgressItemWhereInput = {
            userId,
            status: 'active',
        };

        if (options?.activeDay) {
            where.activeDays = {
                array_contains: options.activeDay,
            };
        }

        return this.prisma.progressItem.count({ where });
    }

    async update(id: string, data: Prisma.ProgressItemUncheckedUpdateInput): Promise<ProgressItem> {
        return this.prisma.progressItem.update({
            where: { id },
            data,
        });
    }

    async settle(id: string): Promise<ProgressItem> {
        return this.prisma.progressItem.update({
            where: { id },
            data: { status: 'settled' },
        });
    }
}
