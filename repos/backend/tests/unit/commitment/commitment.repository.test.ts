import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommitmentRepository } from '../../../src/modules/commitment/repositories/commitment.repository';
// @ts-ignore - MockPrismaClient might verify against real client but we generated it
import { createMockPrismaClient, MockPrismaClient } from '../../setup/mocks/database.mock';
import { Container } from '../../../src/shared/container';

interface MockContainer {
    resolve: (name: string) => { client: MockPrismaClient } | null;
}

describe('CommitmentRepository', () => {
    let mockPrisma: MockPrismaClient;
    let repository: CommitmentRepository;

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
        repository = new CommitmentRepository(mockContainer as unknown as Container);
    });

    describe('create', () => {
        it('should create a commitment', async () => {
            const input = {
                userId: 'user-1',
                title: 'Daily Exercise',
                scheduledDays: ['mon', 'wed', 'fri'],
            };

            const expectedOutput: any = {
                id: 'commitment-1',
                ...input,
                createdAt: new Date(),
                updatedAt: new Date(),
                logs: []
            };

            mockPrisma.commitment.create.mockResolvedValue(expectedOutput);

            const result = await repository.create(input);

            expect(mockPrisma.commitment.create).toHaveBeenCalledWith({
                data: input,
            });
            expect(result).toEqual(expectedOutput);
        });
    });

    describe('findById', () => {
        it('should find a commitment by id', async () => {
            const id = 'commitment-1';
            const expectedOutput: any = {
                id,
                userId: 'user-1',
                title: 'Daily Exercise',
            };

            mockPrisma.commitment.findUnique.mockResolvedValue(expectedOutput);

            const result = await repository.findById(id);

            expect(mockPrisma.commitment.findUnique).toHaveBeenCalledWith({
                where: { id },
            });
            expect(result).toEqual(expectedOutput);
        });
    });

    describe('findByUserId', () => {
        it('should find commitments by user id', async () => {
            const userId = 'user-1';
            const expectedOutput: any[] = [
                { id: 'c1', title: 'Task 1' },
                { id: 'c2', title: 'Task 2' },
            ];

            mockPrisma.commitment.findMany.mockResolvedValue(expectedOutput);

            const result = await repository.findByUserId(userId);

            expect(mockPrisma.commitment.findMany).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            expect(result).toEqual(expectedOutput);
        });
    });

    describe('update', () => {
        it('should update a commitment', async () => {
            const id = 'commitment-1';
            const data = { title: 'Updated Title' };
            const expectedOutput: any = {
                id,
                userId: 'user-1',
                title: 'Updated Title',
            };

            mockPrisma.commitment.update.mockResolvedValue(expectedOutput);

            const result = await repository.update(id, data);

            expect(mockPrisma.commitment.update).toHaveBeenCalledWith({
                where: { id },
                data,
            });
            expect(result).toEqual(expectedOutput);
        });
    });

    describe('delete', () => {
        it('should delete a commitment', async () => {
            const id = 'commitment-1';
            const expectedOutput: any = { id };

            mockPrisma.commitment.delete.mockResolvedValue(expectedOutput);

            const result = await repository.delete(id);

            expect(mockPrisma.commitment.delete).toHaveBeenCalledWith({
                where: { id },
            });
            expect(result).toEqual(expectedOutput);
        });
    });
});
