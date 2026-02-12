import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressLogRepository } from '../../../../src/modules/progress-items/repositories/progress-log.repository';
import { Prisma, ProgressLog } from '@prisma/client';
import { createMockPrismaClient, MockPrismaClient } from '../../../setup/mocks/database.mock';
import { Container } from '../../../../src/shared/container';

interface CreateProgressLogData {
    progressItemId: string;
    loggedAt: Date;
    note?: string;
    isOffDay?: boolean;
}

interface MockContainer {
    resolve: (name: string) => { client: MockPrismaClient } | null;
}

describe('ProgressLogRepository', () => {
    let mockPrisma: MockPrismaClient;
    let repository: ProgressLogRepository;

    const mockDate = new Date('2024-01-01T12:00:00Z');

    const mockLog: ProgressLog = {
        id: 'log-123',
        progressItemId: 'item-123',
        loggedAt: mockDate,
        note: 'Test note',
        isOffDay: false,
        createdAt: mockDate,
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
        repository = new ProgressLogRepository(mockContainer as unknown as Container);
    });

    describe('create', () => {
        it('should create progress log with all fields', async () => {
            const createData: CreateProgressLogData = {
                progressItemId: 'item-123',
                loggedAt: new Date('2024-01-02T10:00:00Z'),
                note: 'New note',
                isOffDay: true,
            };

            const createdLog: ProgressLog = {
                ...mockLog,
                id: 'log-new',
                progressItemId: createData.progressItemId,
                loggedAt: createData.loggedAt,
                note: createData.note!,
                isOffDay: createData.isOffDay!,
            };

            mockPrisma.progressLog.create.mockResolvedValue(createdLog);

            const result = await repository.create(createData);

            expect(result).toEqual(createdLog);
            expect(mockPrisma.progressLog.create).toHaveBeenCalledWith({
                data: {
                    progressItemId: createData.progressItemId,
                    loggedAt: createData.loggedAt,
                    note: createData.note,
                    isOffDay: createData.isOffDay,
                },
            });
        });

        it('should create progress log without optional fields', async () => {
            const createData: CreateProgressLogData = {
                progressItemId: 'item-123',
                loggedAt: new Date('2024-01-02T10:00:00Z'),
            };

            const createdLog: ProgressLog = {
                ...mockLog,
                id: 'log-new',
                progressItemId: createData.progressItemId,
                loggedAt: createData.loggedAt,
                note: null,
                isOffDay: false,
            };

            mockPrisma.progressLog.create.mockResolvedValue(createdLog);

            const result = await repository.create(createData);

            expect(result).toEqual(createdLog);
            expect(mockPrisma.progressLog.create).toHaveBeenCalledWith({
                data: {
                    progressItemId: createData.progressItemId,
                    loggedAt: createData.loggedAt,
                    note: undefined,
                    isOffDay: undefined,
                },
            });
        });
    });

    describe('findByItemId', () => {
        it('should return logs for an item sorted by loggedAt desc', async () => {
            const logs = [mockLog];
            mockPrisma.progressLog.findMany.mockResolvedValue(logs);

            const result = await repository.findByItemId('item-123');

            expect(result).toEqual(logs);
            expect(mockPrisma.progressLog.findMany).toHaveBeenCalledWith({
                where: { progressItemId: 'item-123' },
                orderBy: { loggedAt: 'desc' },
            });
        });
    });

    describe('findByDate', () => {
        it('should return logs for a specific user and date range', async () => {
            // Typically we query by date range (start of day to end of day)
            const startDate = new Date('2024-01-01T00:00:00Z');
            const endDate = new Date('2024-01-01T23:59:59Z');
            const userId = 'user-123';

            const logs = [mockLog];
            mockPrisma.progressLog.findMany.mockResolvedValue(logs);

            const result = await repository.findByDate(userId, startDate, endDate);

            expect(result).toEqual(logs);
            expect(mockPrisma.progressLog.findMany).toHaveBeenCalledWith({
                where: {
                    progressItem: {
                        userId: userId
                    },
                    loggedAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: { loggedAt: 'desc' },
                include: {
                    progressItem: true // Usually want to know which item it belongs to
                }
            });
        });
    });
});
