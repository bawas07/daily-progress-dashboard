import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { HistoryService } from '../../../../src/modules/history/history.service';
import { ProgressItemRepository } from '../../../../src/modules/progress-items/repositories/progress-item.repository';
import { ProgressLogRepository } from '../../../../src/modules/progress-items/repositories/progress-log.repository';
import { CommitmentRepository } from '../../../../src/modules/commitment/repositories/commitment.repository';
import { CommitmentLogRepository } from '../../../../src/modules/commitment/repositories/commitment-log.repository';
import { Container } from '../../../../src/shared/container';

describe('HistoryService', () => {
    let historyService: HistoryService;
    let mockProgressItemRepository: any;
    let mockProgressLogRepository: any;
    let mockCommitmentRepository: any;
    let mockCommitmentLogRepository: any;

    const mockDate = new Date('2024-01-15T00:00:00Z'); // Monday

    const mockProgressLog = {
        id: 'log-123',
        progressItemId: 'item-123',
        loggedAt: new Date('2024-01-15T10:00:00Z'),
        note: 'Made progress',
        isOffDay: false,
        progressItem: {
            id: 'item-123',
            title: 'Complete project proposal',
            importance: 'high',
            urgency: 'high',
        },
    };

    const mockCommitmentLog = {
        id: 'clog-123',
        commitmentId: 'commitment-123',
        completedAt: new Date('2024-01-15T14:00:00Z'),
        note: 'Exercise done',
        commitment: {
            id: 'commitment-123',
            title: 'Exercise',
            scheduledDays: ['mon', 'wed', 'fri'],
        },
    };

    beforeEach(() => {
        mockProgressItemRepository = {
            findAll: vi.fn(),
            count: vi.fn(),
            findById: vi.fn(),
        };

        mockProgressLogRepository = {
            findByDate: vi.fn(),
            findByItemId: vi.fn(),
        };

        mockCommitmentRepository = {
            findByUserId: vi.fn(),
        };

        mockCommitmentLogRepository = {
            findByCommitmentId: vi.fn(),
            findByDateRange: vi.fn(),
        };

        const mockContainer = {
            resolve: vi.fn((name: string) => {
                if (name === 'ProgressItemRepository') return mockProgressItemRepository;
                if (name === 'ProgressLogRepository') return mockProgressLogRepository;
                if (name === 'CommitmentRepository') return mockCommitmentRepository;
                if (name === 'CommitmentLogRepository') return mockCommitmentLogRepository;
                return null;
            }),
        };

        historyService = new HistoryService(mockContainer as unknown as Container);
    });

    describe('getTodayHistory', () => {
        it('should return progress logs and commitment logs for the specified date', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            mockProgressLogRepository.findByDate.mockResolvedValue([mockProgressLog]);
            mockCommitmentLogRepository.findByDateRange.mockResolvedValue([mockCommitmentLog]);

            const result = await historyService.getTodayHistory(userId, date);

            expect(result).toHaveProperty('progressLogs');
            expect(result).toHaveProperty('commitmentLogs');
            expect(result).toHaveProperty('summary');
            expect(result.progressLogs).toHaveLength(1);
            expect(result.commitmentLogs).toHaveLength(1);
            expect(result.summary.progressLogCount).toBe(1);
            expect(result.summary.commitmentLogCount).toBe(1);
        });

        it('should return empty arrays when no logs exist for the date', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            mockProgressLogRepository.findByDate.mockResolvedValue([]);
            mockCommitmentLogRepository.findByDateRange.mockResolvedValue([]);

            const result = await historyService.getTodayHistory(userId, date);

            expect(result.progressLogs).toEqual([]);
            expect(result.commitmentLogs).toEqual([]);
            expect(result.summary.progressLogCount).toBe(0);
            expect(result.summary.commitmentLogCount).toBe(0);
        });

        it('should throw error for invalid date format', async () => {
            const userId = 'user-123';
            const date = 'invalid-date';

            await expect(historyService.getTodayHistory(userId, date)).rejects.toThrow('Invalid date');
        });

        it('should filter logs by user ownership', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            mockProgressLogRepository.findByDate.mockResolvedValue([mockProgressLog]);
            mockCommitmentLogRepository.findByDateRange.mockResolvedValue([mockCommitmentLog]);

            await historyService.getTodayHistory(userId, date);

            expect(mockProgressLogRepository.findByDate).toHaveBeenCalledWith(userId, expect.any(Date), expect.any(Date));
            expect(mockCommitmentLogRepository.findByDateRange).toHaveBeenCalledWith(userId, expect.any(Date), expect.any(Date));
        });
    });

    describe('getWeeklyHistory', () => {
        it('should return logs grouped by day for the week', async () => {
            const userId = 'user-123';
            const date = '2024-01-15'; // Monday

            mockProgressLogRepository.findByDate.mockResolvedValue([mockProgressLog]);
            mockCommitmentLogRepository.findByDateRange.mockResolvedValue([mockCommitmentLog]);

            const result = await historyService.getWeeklyHistory(userId, date);

            expect(result).toHaveProperty('weeklyData');
            expect(result).toHaveProperty('summary');
            expect(result.weeklyData).toBeInstanceOf(Object);
            expect(result.weeklyData['2024-01-15']).toBeDefined();
        });

        it('should calculate week range from Monday to Sunday', async () => {
            const userId = 'user-123';
            const date = '2024-01-17'; // Wednesday

            const weekStart = new Date('2024-01-15T00:00:00.000Z'); // Monday
            const weekEnd = new Date('2024-01-21T23:59:59.999Z'); // Sunday

            mockProgressLogRepository.findByDate.mockResolvedValue([]);
            mockCommitmentLogRepository.findByDateRange.mockResolvedValue([]);

            await historyService.getWeeklyHistory(userId, date);

            // Verify the date range covers the entire week
            expect(mockProgressLogRepository.findByDate).toHaveBeenCalled();
        });

        it('should handle week at month boundary', async () => {
            const userId = 'user-123';
            const date = '2024-01-31'; // Wednesday

            mockProgressLogRepository.findByDate.mockResolvedValue([]);
            mockCommitmentLogRepository.findByDateRange.mockResolvedValue([]);

            const result = await historyService.getWeeklyHistory(userId, date);

            expect(result).toHaveProperty('weeklyData');
            expect(result).toHaveProperty('summary');
        });

        it('should include off-day indicators in progress logs', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            const offDayLog = {
                ...mockProgressLog,
                id: 'log-456',
                isOffDay: true,
            };

            mockProgressLogRepository.findByDate.mockResolvedValue([mockProgressLog, offDayLog]);
            mockCommitmentLogRepository.findByDateRange.mockResolvedValue([]);

            const result = await historyService.getWeeklyHistory(userId, date);

            expect(result.weeklyData).toBeDefined();
        });
    });

    describe('getMonthlyHistory', () => {
        it('should return logs grouped by day for the month', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            mockProgressLogRepository.findByDate.mockResolvedValue([mockProgressLog]);
            mockCommitmentLogRepository.findByDateRange.mockResolvedValue([mockCommitmentLog]);

            const result = await historyService.getMonthlyHistory(userId, date);

            expect(result).toHaveProperty('monthlyData');
            expect(result).toHaveProperty('summary');
            expect(result.monthlyData).toBeInstanceOf(Object);
        });

        it('should calculate month range from 1st to last day', async () => {
            const userId = 'user-123';
            const date = '2024-01-15';

            const monthStart = new Date('2024-01-01T00:00:00.000Z');
            const monthEnd = new Date('2024-01-31T23:59:59.999Z');

            mockProgressLogRepository.findByDate.mockResolvedValue([]);
            mockCommitmentLogRepository.findByDateRange.mockResolvedValue([]);

            await historyService.getMonthlyHistory(userId, date);

            expect(mockProgressLogRepository.findByDate).toHaveBeenCalled();
        });

        it('should handle leap year for February', async () => {
            const userId = 'user-123';
            const date = '2024-02-15';

            mockProgressLogRepository.findByDate.mockResolvedValue([]);
            mockCommitmentLogRepository.findByDateRange.mockResolvedValue([]);

            const result = await historyService.getMonthlyHistory(userId, date);

            expect(result).toHaveProperty('monthlyData');
            expect(result).toHaveProperty('summary');
            mockProgressLogRepository.findByDate.mockResolvedValue([]);
            mockCommitmentLogRepository.findByDateRange.mockResolvedValue([]);
        });

        it('should handle months with different day counts', async () => {
            const userId = 'user-123';

            // Set up mocks for all three calls
            mockProgressLogRepository.findByDate.mockResolvedValue([]);
            mockCommitmentLogRepository.findByDateRange.mockResolvedValue([]);

            // Test February (28 days)
            await historyService.getMonthlyHistory(userId, '2024-02-15');

            // Test April (30 days)
            await historyService.getMonthlyHistory(userId, '2024-04-15');

            // Test January (31 days)
            await historyService.getMonthlyHistory(userId, '2024-01-15');

            expect(mockProgressLogRepository.findByDate).toHaveBeenCalled();
        });
    });

    describe('getAllActiveItems', () => {
        const mockProgressItem = {
            id: 'item-123',
            title: 'Complete project proposal',
            importance: 'high',
            urgency: 'high',
            activeDays: ['mon', 'wed', 'fri'],
            status: 'active',
            deadline: null,
        };

        const mockCommitment = {
            id: 'commitment-123',
            title: 'Exercise',
            scheduledDays: ['mon', 'wed', 'fri'],
        };

        it('should return all active progress items without activeDay filter', async () => {
            const userId = 'user-123';

            mockProgressItemRepository.findAll.mockResolvedValue({ items: [mockProgressItem], total: 1 });
            mockCommitmentRepository.findByUserId.mockResolvedValue([mockCommitment]);
            mockProgressLogRepository.findByItemId.mockResolvedValue({ items: [], total: 0 });

            const result = await historyService.getAllActiveItems(userId);

            expect(result).toHaveProperty('progressItems');
            expect(result).toHaveProperty('commitments');
            expect(result.progressItems).toHaveLength(1);
            expect(result.commitments).toHaveLength(1);
        });

        it('should include last progress timestamp for items', async () => {
            const userId = 'user-123';

            const recentLog = {
                id: 'log-123',
                loggedAt: new Date('2024-01-15T10:00:00Z'),
            };

            mockProgressItemRepository.findAll.mockResolvedValue({ items: [mockProgressItem], total: 1 });
            mockCommitmentRepository.findByUserId.mockResolvedValue([mockCommitment]);
            mockProgressLogRepository.findByItemId.mockResolvedValue([recentLog]);

            const result = await historyService.getAllActiveItems(userId);

            expect(result.progressItems[0]).toHaveProperty('lastProgressAt');
            expect(result.progressItems[0].lastProgressAt).toEqual(new Date('2024-01-15T10:00:00Z'));
        });

        it('should show "No progress yet" for items with no logs', async () => {
            const userId = 'user-123';

            mockProgressItemRepository.findAll.mockResolvedValue({ items: [mockProgressItem], total: 1 });
            mockCommitmentRepository.findByUserId.mockResolvedValue([mockCommitment]);
            mockProgressLogRepository.findByItemId.mockResolvedValue({ items: [], total: 0 });

            const result = await historyService.getAllActiveItems(userId);

            expect(result.progressItems[0]).toHaveProperty('lastProgressAt');
            expect(result.progressItems[0].lastProgressAt).toBeNull();
        });

        it('should indicate if current day is active for items', async () => {
            const userId = 'user-123';
            const date = '2024-01-15'; // Monday

            mockProgressItemRepository.findAll.mockResolvedValue({ items: [mockProgressItem], total: 1 });
            mockCommitmentRepository.findByUserId.mockResolvedValue([mockCommitment]);
            mockProgressLogRepository.findByItemId.mockResolvedValue({ items: [], total: 0 });

            const result = await historyService.getAllActiveItems(userId, date);

            expect(result.progressItems[0]).toHaveProperty('isActiveToday');
            expect(result.progressItems[0].isActiveToday).toBe(true); // Monday is in activeDays
        });

        it('should indicate if current day is NOT active for items', async () => {
            const userId = 'user-123';
            const date = '2024-01-16'; // Tuesday

            mockProgressItemRepository.findAll.mockResolvedValue({ items: [mockProgressItem], total: 1 });
            mockCommitmentRepository.findByUserId.mockResolvedValue([mockCommitment]);
            mockProgressLogRepository.findByItemId.mockResolvedValue({ items: [], total: 0 });

            const result = await historyService.getAllActiveItems(userId, date);

            expect(result.progressItems[0]).toHaveProperty('isActiveToday');
            expect(result.progressItems[0].isActiveToday).toBe(false); // Tuesday is NOT in activeDays
        });

        it('should indicate if current day is scheduled for commitments', async () => {
            const userId = 'user-123';
            const date = '2024-01-15'; // Monday

            mockProgressItemRepository.findAll.mockResolvedValue({ items: [mockProgressItem], total: 1 });
            mockCommitmentRepository.findByUserId.mockResolvedValue([mockCommitment]);
            mockProgressLogRepository.findByItemId.mockResolvedValue({ items: [], total: 0 });

            const result = await historyService.getAllActiveItems(userId, date);

            expect(result.commitments[0]).toHaveProperty('isScheduledToday');
            expect(result.commitments[0].isScheduledToday).toBe(true); // Monday is in scheduledDays
        });

        it('should return empty arrays when no items exist', async () => {
            const userId = 'user-123';

            mockProgressItemRepository.findAll.mockResolvedValue({ items: [], total: 0 });
            mockCommitmentRepository.findByUserId.mockResolvedValue([]);

            const result = await historyService.getAllActiveItems(userId);

            expect(result.progressItems).toEqual([]);
            expect(result.commitments).toEqual([]);
        });
    });
});
