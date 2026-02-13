import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommitmentService } from '../../../src/modules/commitment/services/commitment.service';
import { Container } from '../../../src/shared/container';

describe('CommitmentService', () => {
    let service: CommitmentService;
    let mockCommitmentRepository: any;
    let mockCommitmentLogRepository: any;

    beforeEach(() => {
        mockCommitmentRepository = {
            create: vi.fn(),
            findByUserId: vi.fn(),
            findById: vi.fn(),
            delete: vi.fn(),
        };

        mockCommitmentLogRepository = {
            create: vi.fn(),
            countByCommitmentIdAndDate: vi.fn(),
        };

        const mockContainer = {
            resolve: vi.fn((name: string) => {
                if (name === 'CommitmentRepository') return mockCommitmentRepository;
                if (name === 'CommitmentLogRepository') return mockCommitmentLogRepository;
                return null;
            }),
        };

        service = new CommitmentService(mockContainer as unknown as Container);
    });

    describe('create', () => {
        it('should create a commitment with valid data', async () => {
            const userId = 'user-1';
            const input = {
                title: 'Daily Exercise',
                scheduledDays: ['mon', 'wed', 'fri'],
            };

            const expectedOutput = {
                id: 'c-1',
                userId,
                ...input,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockCommitmentRepository.create.mockResolvedValue(expectedOutput);

            const result = await service.create(userId, input);

            expect(mockCommitmentRepository.create).toHaveBeenCalledWith({
                userId,
                ...input,
            });
            expect(result).toEqual(expectedOutput);
        });

        it('should throw error if scheduled days are invalid', async () => {
            const userId = 'user-1';
            const input = {
                title: 'Bad Days',
                scheduledDays: ['invalid-day'],
            };

            await expect(service.create(userId, input)).rejects.toThrow('Invalid scheduled days');
        });
    });

    describe('logCommitment', () => {
        it('should log a commitment', async () => {
            const userId = 'user-1';
            const commitmentId = 'c-1';
            const input = { note: 'Done' };

            const commitment = { id: commitmentId, userId };
            mockCommitmentRepository.findById.mockResolvedValue(commitment);

            const expectedLog = {
                id: 'l-1',
                commitmentId,
                completedAt: expect.any(Date),
                note: 'Done',
            };
            mockCommitmentLogRepository.create.mockResolvedValue(expectedLog);

            const result = await service.logCommitment(userId, commitmentId, input);

            expect(mockCommitmentRepository.findById).toHaveBeenCalledWith(commitmentId);
            expect(mockCommitmentLogRepository.create).toHaveBeenCalledWith({
                commitmentId,
                note: input.note,
                completedAt: expect.any(Date),
            });
            expect(result).toEqual(expectedLog);
        });

        it('should throw error if commitment not found', async () => {
            mockCommitmentRepository.findById.mockResolvedValue(null);

            await expect(service.logCommitment('user-1', 'c-1', {})).rejects.toThrow('Commitment not found');
        });

        it('should throw error if commitment belongs to another user', async () => {
            mockCommitmentRepository.findById.mockResolvedValue({ id: 'c-1', userId: 'other-user' });

            await expect(service.logCommitment('user-1', 'c-1', {})).rejects.toThrow('Commitment not found');
        });
    });

    describe('getCommitments', () => {
        it('should return commitments with completion status for today', async () => {
            const userId = 'user-1';
            const commitments = [
                { id: 'c-1', title: 'Task 1' },
                { id: 'c-2', title: 'Task 2' },
            ];

            mockCommitmentRepository.findByUserId.mockResolvedValue(commitments);
            mockCommitmentLogRepository.countByCommitmentIdAndDate.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

            const result = await service.getCommitments(userId);

            expect(result).toEqual([
                { ...commitments[0], completedToday: true },
                { ...commitments[1], completedToday: false },
            ]);
        });
    });
});
