import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressItemRepository } from '../../../../src/modules/progress-items/repositories/progress-item.repository';
import { Prisma, ProgressItem } from '@prisma/client';
import { createMockPrismaClient, MockPrismaClient } from '../../../setup/mocks/database.mock';
import { Container } from '../../../../src/shared/container';

interface CreateProgressItemData {
    userId: string;
    title: string;
    importance: string;
    urgency: string;
    activeDays: string[];
}

interface MockContainer {
    resolve: (name: string) => { client: MockPrismaClient } | null;
}

describe('ProgressItemRepository', () => {
    let mockPrisma: MockPrismaClient;
    let repository: ProgressItemRepository;

    const mockDate = new Date('2024-01-01T00:00:00Z');

    const mockProgressItem: ProgressItem = {
        id: 'item-123',
        userId: 'user-123',
        title: 'Test Item',
        importance: 'high',
        urgency: 'high',
        activeDays: ['mon', 'tue'],
        deadline: null,
        status: 'active',
        createdAt: mockDate,
        updatedAt: mockDate,
    };

    beforeEach(() => {
        mockPrisma = createMockPrismaClient();
        const mockContainer: MockContainer = {
            resolve: vi.fn((name: string) => {
                if (name === 'DatabaseService') {
                    return { client: mockPrisma };
                }
                return null;
            }),
        };
        repository = new ProgressItemRepository(mockContainer as unknown as Container);
    });

    describe('create', () => {
        it('should create progress item with required fields', async () => {
            const createData: CreateProgressItemData = {
                userId: 'user-123',
                title: 'New Item',
                importance: 'low',
                urgency: 'low',
                activeDays: ['wed'],
            };

            const createdItem: ProgressItem = {
                ...mockProgressItem,
                id: 'item-new',
                title: createData.title,
                importance: createData.importance,
                urgency: createData.urgency,
                activeDays: createData.activeDays,
            };

            mockPrisma.progressItem.create.mockResolvedValue(createdItem);

            const result = await repository.create(createData);

            expect(result).toEqual(createdItem);
            expect(mockPrisma.progressItem.create).toHaveBeenCalledWith({
                data: {
                    userId: createData.userId,
                    title: createData.title,
                    importance: createData.importance,
                    urgency: createData.urgency,
                    activeDays: createData.activeDays,
                    status: 'active',
                },
            });
        });
    });

    describe('findById', () => {
        it('should return item when it exists', async () => {
            mockPrisma.progressItem.findUnique.mockResolvedValue(mockProgressItem);

            const result = await repository.findById('item-123');

            expect(result).toEqual(mockProgressItem);
            expect(mockPrisma.progressItem.findUnique).toHaveBeenCalledWith({
                where: { id: 'item-123' },
            });
        });

        it('should return null when item does not exist', async () => {
            mockPrisma.progressItem.findUnique.mockResolvedValue(null);

            const result = await repository.findById('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('findAll', () => {
        it('should return items for a user', async () => {
            const items = [mockProgressItem];
            // Mock both count and findMany for paginated queries usually, but findAll here returns directly array.
            // Wait, repository usually returns what Prisma returns.
            // If I want pagination metadata (total count), repository might need to return { items, total }.
            // BUT `createPaginatedResponse` expects separate count. 
            // Typically repository methods: `findAll` returns array, `count` returns number.
            // OR `findAll` returns { items, total }.
            // Existing patterns? user-preferences controller doesn't panic about pagination.
            // Let's stick to `findAll` returning array, and maybe a separate `count` method or `findAll` returns tuple.
            // For now, let's assume `findAll` returns array and we add pagination support via options.

            mockPrisma.progressItem.findMany.mockResolvedValue(items);

            const result = await repository.findAll('user-123');

            expect(result).toEqual(items);
            expect(mockPrisma.progressItem.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-123',
                    status: 'active',
                },
                orderBy: { updatedAt: 'desc' },
            });
        });

        it('should filter by active days when provided', async () => {
            const items = [mockProgressItem];
            mockPrisma.progressItem.findMany.mockResolvedValue(items);

            const result = await repository.findAll('user-123', { activeDay: 'mon' });

            expect(result).toEqual(items);
            expect(mockPrisma.progressItem.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-123',
                    status: 'active',
                    activeDays: {
                        array_contains: 'mon'
                    }
                },
                orderBy: { updatedAt: 'desc' },
            });
        });

        it('should apply pagination options', async () => {
            const items = [mockProgressItem];
            mockPrisma.progressItem.findMany.mockResolvedValue(items);

            await repository.findAll('user-123', { skip: 10, take: 5 });

            expect(mockPrisma.progressItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 10,
                take: 5
            }));
        });
    });

    describe('count', () => {
        it('should count items for a user with filters', async () => {
            mockPrisma.progressItem.count.mockResolvedValue(5);

            const count = await repository.count('user-123', { activeDay: 'mon' });

            expect(count).toBe(5);
            expect(mockPrisma.progressItem.count).toHaveBeenCalledWith({
                where: {
                    userId: 'user-123',
                    status: 'active',
                    activeDays: {
                        array_contains: 'mon'
                    }
                }
            });
        });
    });

    describe('settle', () => {
        it('should update status to settled', async () => {
            const settledItem = { ...mockProgressItem, status: 'settled' };
            mockPrisma.progressItem.update.mockResolvedValue(settledItem);

            const result = await repository.settle('item-123');

            expect(result).toEqual(settledItem);
            expect(mockPrisma.progressItem.update).toHaveBeenCalledWith({
                where: { id: 'item-123' },
                data: { status: 'settled' },
            });
        });
    });
});
