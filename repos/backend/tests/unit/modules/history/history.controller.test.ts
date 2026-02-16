import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryController } from '../../../../src/modules/history/history.controller';
import { Context } from 'hono';
import { createSuccessResponse, createErrorResponse, serverError } from '../../../../src/shared/response/response.helper';
import { ResponseCodes } from '../../../../src/shared/response/response.types';

describe('HistoryController', () => {
    let historyController: HistoryController;
    let mockHistoryService: any;

    beforeEach(() => {
        mockHistoryService = {
            getTodayHistory: vi.fn(),
            getWeeklyHistory: vi.fn(),
            getMonthlyHistory: vi.fn(),
            getAllActiveItems: vi.fn(),
        };

        historyController = new HistoryController(mockHistoryService);
    });

    describe('getTodayHistory', () => {
        it('should return today history data with valid date parameter', async () => {
            const mockHistoryData = {
                progressLogs: [
                    {
                        id: 'log-123',
                        note: 'Made progress',
                        loggedAt: new Date('2024-01-15T10:00:00Z'),
                        isOffDay: false,
                        progressItem: {
                            id: 'item-123',
                            title: 'Complete project',
                        },
                    },
                ],
                commitmentLogs: [
                    {
                        id: 'clog-123',
                        note: 'Done',
                        completedAt: new Date('2024-01-15T14:00:00Z'),
                        commitment: {
                            id: 'commitment-123',
                            title: 'Exercise',
                        },
                    },
                ],
                summary: {
                    progressLogCount: 1,
                    commitmentLogCount: 1,
                },
            };

            mockHistoryService.getTodayHistory.mockResolvedValue(mockHistoryData);

            const mockContext = {
                get: vi.fn((key) => {
                    if (key === 'userId') return 'user-123';
                    return undefined;
                }),
                req: {
                    query: () => ({ date: '2024-01-15' }),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getTodayHistory();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                createSuccessResponse(ResponseCodes.SUCCESS, 'History retrieved successfully', mockHistoryData)
            );
        });

        it('should return 401 when userId is missing', async () => {
            const mockContext = {
                get: vi.fn(() => undefined),
                req: {
                    query: () => ({ date: '2024-01-15' }),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getTodayHistory();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                createErrorResponse(ResponseCodes.AUTH_ERROR, 'Authentication required'),
                401
            );
        });

        it('should return 400 when date parameter is missing', async () => {
            const mockContext = {
                get: vi.fn((key) => {
                    if (key === 'userId') return 'user-123';
                    return undefined;
                }),
                req: {
                    query: () => ({}),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getTodayHistory();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                createErrorResponse(ResponseCodes.VALIDATION_ERROR, 'Date query parameter is required'),
                400
            );
        });

        it('should handle service errors', async () => {
            mockHistoryService.getTodayHistory.mockRejectedValue(new Error('Database error'));

            const mockContext = {
                get: vi.fn((key) => {
                    if (key === 'userId') return 'user-123';
                    return undefined;
                }),
                req: {
                    query: () => ({ date: '2024-01-15' }),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getTodayHistory();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                serverError('Internal server error'),
                500
            );
        });

        it('should handle invalid date error from service', async () => {
            mockHistoryService.getTodayHistory.mockRejectedValue(new Error('Invalid date'));

            const mockContext = {
                get: vi.fn((key) => {
                    if (key === 'userId') return 'user-123';
                    return undefined;
                }),
                req: {
                    query: () => ({ date: 'invalid-date' }),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getTodayHistory();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                createErrorResponse(ResponseCodes.VALIDATION_ERROR, 'Invalid date'),
                400
            );
        });
    });

    describe('getWeeklyHistory', () => {
        it('should return weekly history data with valid date parameter', async () => {
            const mockWeeklyData = {
                weeklyData: {
                    '2024-01-15': {
                        progressLogs: [],
                        commitmentLogs: [],
                    },
                },
                summary: {
                    totalProgressLogs: 5,
                    totalCommitmentLogs: 7,
                },
            };

            mockHistoryService.getWeeklyHistory.mockResolvedValue(mockWeeklyData);

            const mockContext = {
                get: vi.fn((key) => {
                    if (key === 'userId') return 'user-123';
                    return undefined;
                }),
                req: {
                    query: () => ({ date: '2024-01-15' }),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getWeeklyHistory();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                createSuccessResponse(ResponseCodes.SUCCESS, 'Weekly history retrieved successfully', mockWeeklyData)
            );
        });

        it('should return 401 when userId is missing', async () => {
            const mockContext = {
                get: vi.fn(() => undefined),
                req: {
                    query: () => ({ date: '2024-01-15' }),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getWeeklyHistory();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                createErrorResponse(ResponseCodes.AUTH_ERROR, 'Authentication required'),
                401
            );
        });

        it('should return 400 when date parameter is missing', async () => {
            const mockContext = {
                get: vi.fn((key) => {
                    if (key === 'userId') return 'user-123';
                    return undefined;
                }),
                req: {
                    query: () => ({}),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getWeeklyHistory();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                createErrorResponse(ResponseCodes.VALIDATION_ERROR, 'Date query parameter is required'),
                400
            );
        });
    });

    describe('getMonthlyHistory', () => {
        it('should return monthly history data with valid date parameter', async () => {
            const mockMonthlyData = {
                monthlyData: {
                    '2024-01-01': {
                        progressLogs: [],
                        commitmentLogs: [],
                    },
                },
                summary: {
                    totalProgressLogs: 20,
                    totalCommitmentLogs: 30,
                },
            };

            mockHistoryService.getMonthlyHistory.mockResolvedValue(mockMonthlyData);

            const mockContext = {
                get: vi.fn((key) => {
                    if (key === 'userId') return 'user-123';
                    return undefined;
                }),
                req: {
                    query: () => ({ date: '2024-01-15' }),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getMonthlyHistory();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                createSuccessResponse(ResponseCodes.SUCCESS, 'Monthly history retrieved successfully', mockMonthlyData)
            );
        });

        it('should return 401 when userId is missing', async () => {
            const mockContext = {
                get: vi.fn(() => undefined),
                req: {
                    query: () => ({ date: '2024-01-15' }),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getMonthlyHistory();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                createErrorResponse(ResponseCodes.AUTH_ERROR, 'Authentication required'),
                401
            );
        });

        it('should return 400 when date parameter is missing', async () => {
            const mockContext = {
                get: vi.fn((key) => {
                    if (key === 'userId') return 'user-123';
                    return undefined;
                }),
                req: {
                    query: () => ({}),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getMonthlyHistory();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                createErrorResponse(ResponseCodes.VALIDATION_ERROR, 'Date query parameter is required'),
                400
            );
        });
    });

    describe('getAllActiveItems', () => {
        it('should return all active items', async () => {
            const mockAllItems = {
                progressItems: [
                    {
                        id: 'item-123',
                        title: 'Complete project',
                        isActiveToday: true,
                        lastProgressAt: new Date('2024-01-15T10:00:00Z'),
                    },
                ],
                commitments: [
                    {
                        id: 'commitment-123',
                        title: 'Exercise',
                        isScheduledToday: true,
                    },
                ],
            };

            mockHistoryService.getAllActiveItems.mockResolvedValue(mockAllItems);

            const mockContext = {
                get: vi.fn((key) => {
                    if (key === 'userId') return 'user-123';
                    return undefined;
                }),
                req: {
                    query: () => ({ date: '2024-01-15' }),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getAllActiveItems();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                createSuccessResponse(ResponseCodes.SUCCESS, 'All active items retrieved successfully', mockAllItems)
            );
        });

        it('should work without date parameter (defaults to today)', async () => {
            const mockAllItems = {
                progressItems: [],
                commitments: [],
            };

            mockHistoryService.getAllActiveItems.mockResolvedValue(mockAllItems);

            const mockContext = {
                get: vi.fn((key) => {
                    if (key === 'userId') return 'user-123';
                    return undefined;
                }),
                req: {
                    query: () => ({}),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getAllActiveItems();
            await handler(mockContext);

            expect(mockHistoryService.getAllActiveItems).toHaveBeenCalledWith('user-123', undefined);
            expect(mockContext.json).toHaveBeenCalledWith(
                createSuccessResponse(ResponseCodes.SUCCESS, 'All active items retrieved successfully', mockAllItems)
            );
        });

        it('should return 401 when userId is missing', async () => {
            const mockContext = {
                get: vi.fn(() => undefined),
                req: {
                    query: () => ({}),
                },
                json: vi.fn().mockReturnThis(),
            } as unknown as Context;

            const handler = historyController.getAllActiveItems();
            await handler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                createErrorResponse(ResponseCodes.AUTH_ERROR, 'Authentication required'),
                401
            );
        });
    });
});
