import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommitmentLogRepository } from '../../../src/modules/commitment/repositories/commitment-log.repository';
// @ts-ignore
import { createMockPrismaClient, MockPrismaClient } from '../../setup/mocks/database.mock';
import { Container } from '../../../src/shared/container';

interface MockContainer {
    resolve: (name: string) => { client: MockPrismaClient } | null;
}

describe('CommitmentLogRepository', () => {
    let mockPrisma: MockPrismaClient;
    let repository: CommitmentLogRepository;

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
        repository = new CommitmentLogRepository(mockContainer as unknown as Container);
    });

    describe('create', () => {
        it('should create a commitment log with note', async () => {
            const input = {
                commitmentId: 'commitment-1',
                completedAt: new Date(),
                note: 'Completed successfully',
            };

            const expectedOutput: any = {
                id: 'log-1',
                ...input,
                createdAt: new Date(),
            };

            mockPrisma.commitmentLog.create.mockResolvedValue(expectedOutput);

            const result = await repository.create(input);

            expect(mockPrisma.commitmentLog.create).toHaveBeenCalledWith({
                data: input,
            });
            expect(result).toEqual(expectedOutput);
        });
    });

    describe('findByCommitmentId', () => {
        it('should find logs by commitment id', async () => {
            const commitmentId = 'commitment-1';
            const expectedOutput: any[] = [
                { id: 'log-1', completedAt: new Date() },
                { id: 'log-2', completedAt: new Date() },
            ];

            mockPrisma.commitmentLog.findMany.mockResolvedValue(expectedOutput);

            const result = await repository.findByCommitmentId(commitmentId);

            expect(mockPrisma.commitmentLog.findMany).toHaveBeenCalledWith({
                where: { commitmentId },
                orderBy: { completedAt: 'desc' },
            });
            expect(result).toEqual(expectedOutput);
        });
    });

    describe('countByCommitmentIdAndDate', () => {
        it('should count logs for a commitment on a specific date', async () => {
            const commitmentId = 'commitment-1';
            const date = new Date('2024-01-01');
            const startOfDay = new Date('2024-01-01T00:00:00.000Z');
            const endOfDay = new Date('2024-01-01T23:59:59.999Z');

            mockPrisma.commitmentLog.count.mockResolvedValue(2);

            const result = await repository.countByCommitmentIdAndDate(commitmentId, date);

            expect(mockPrisma.commitmentLog.count).toHaveBeenCalledWith({
                where: {
                    commitmentId,
                    completedAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            });
            expect(result).toBe(2);
        });
    });

    describe('delete', () => {
        it('should delete a log', async () => {
            const id = 'log-1';
            const expectedOutput: any = { id };

            mockPrisma.commitmentLog.delete.mockResolvedValue(expectedOutput);

            const result = await repository.delete(id);

            expect(mockPrisma.commitmentLog.delete).toHaveBeenCalledWith({
                where: { id },
            });
            expect(result).toEqual(expectedOutput);
        });
    });
});
