import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardController } from '../../../../src/modules/dashboard/dashboard.controller';
import type { Context } from 'hono';

function createMockContext(query: any = null) {
    return {
        req: {
            query: () => query || {},
        },
        get: vi.fn().mockReturnValue('user-123'),
        json: vi.fn(),
    } as unknown as Context;
}

describe('DashboardController', () => {
    let dashboardController: DashboardController;
    let mockDashboardService: any;

    const mockDashboardData = {
        timeline: {
            events: [
                {
                    id: 'event-123',
                    title: 'Morning Standup',
                    startTime: new Date('2024-01-15T09:00:00Z'),
                    durationMinutes: 30,
                },
            ],
        },
        progressItems: {
            important: {
                urgent: [
                    {
                        id: 'item-123',
                        title: 'Complete project proposal',
                        importance: 'high',
                        urgency: 'high',
                    },
                ],
                notUrgent: [],
            },
            notImportant: {
                urgent: [],
                notUrgent: [],
            },
        },
        commitments: [
            {
                id: 'commitment-123',
                title: 'Exercise',
                scheduledDays: ['mon', 'wed', 'fri'],
                completedToday: false,
                completionCount: 0,
            },
        ],
    };

    beforeEach(() => {
        mockDashboardService = {
            getDashboardData: vi.fn(),
        };

        dashboardController = new DashboardController(mockDashboardService);
    });

    describe('getDashboard', () => {
        it('should return dashboard data with 200 status', async () => {
            const date = '2024-01-15';

            mockDashboardService.getDashboardData.mockResolvedValue(mockDashboardData);

            const ctx = createMockContext({ date });
            await dashboardController.getDashboard()(ctx);

            expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith('user-123', date);
            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: mockDashboardData,
                    code: 'S001',
                    message: 'Dashboard data retrieved',
                })
            );
        });

        it('should handle date query parameter', async () => {
            const date = '2024-01-15';

            mockDashboardService.getDashboardData.mockResolvedValue(mockDashboardData);

            const ctx = createMockContext({ date });
            await dashboardController.getDashboard()(ctx);

            expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith('user-123', date);
        });

        it('should return 400 error for invalid date format', async () => {
            mockDashboardService.getDashboardData.mockRejectedValue(new Error('Invalid date'));

            const ctx = createMockContext({ date: 'invalid-date' });
            await dashboardController.getDashboard()(ctx);

            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E001',
                }),
                400
            );
        });

        it('should return 401 error when userId is missing', async () => {
            const ctx = createMockContext({ date: '2024-01-15' });
            ctx.get = vi.fn().mockReturnValue(undefined);

            await dashboardController.getDashboard()(ctx);

            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E002',
                    message: 'Authentication required',
                }),
                401
            );
        });

        it('should return 500 error for server errors', async () => {
            const date = '2024-01-15';

            mockDashboardService.getDashboardData.mockRejectedValue(new Error('Database connection failed'));

            const ctx = createMockContext({ date });
            await dashboardController.getDashboard()(ctx);

            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E004',
                    message: 'Internal server error',
                }),
                500
            );
        });

        it('should extract userId from context', async () => {
            const date = '2024-01-15';

            mockDashboardService.getDashboardData.mockResolvedValue(mockDashboardData);

            const ctx = createMockContext({ date });
            ctx.get = vi.fn().mockReturnValue('user-456');

            await dashboardController.getDashboard()(ctx);

            expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith('user-456', date);
        });

        it('should handle service errors gracefully', async () => {
            const date = '2024-01-15';

            mockDashboardService.getDashboardData.mockRejectedValue(new Error('Service unavailable'));

            const ctx = createMockContext({ date });
            await dashboardController.getDashboard()(ctx);

            expect(ctx.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'E004',
                    message: 'Internal server error',
                }),
                500
            );
        });
    });
});
