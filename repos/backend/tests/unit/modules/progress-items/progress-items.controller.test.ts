import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Hono } from 'hono';
import { ProgressItemsController } from '../../../../src/modules/progress-items/progress-items.controller';
import { ProgressItemService, ValidationError, NotFoundError } from '../../../../src/modules/progress-items/services/progress-item.service';
import { ProgressItem, ProgressLog } from '@prisma/client';

describe('ProgressItemsController', () => {
    let mockService: ProgressItemService;
    let controller: ProgressItemsController;

    const mockDate = new Date('2024-01-01T12:00:00Z');
    const mockItem: ProgressItem = {
        id: 'item-123',
        userId: 'user-123',
        title: 'Test Item',
        importance: 'high',
        urgency: 'high',
        activeDays: ['mon', 'wed'],
        deadline: null,
        status: 'active',
        createdAt: mockDate,
        updatedAt: mockDate,
    };

    // Inline mock middleware
    const mockAuthMiddleware = async (c: any, next: any) => {
        c.set('userId', 'user-123');
        await next();
    };

    beforeEach(() => {
        // Mock Service
        mockService = {
            create: vi.fn(),
            logProgress: vi.fn(),
            getAll: vi.fn(),
            update: vi.fn(),
            settle: vi.fn(),
            getLogs: vi.fn(),
        } as unknown as ProgressItemService;

        controller = new ProgressItemsController(mockService);
    });

    describe('POST /api/progress-items', () => {
        it('should create a progress item successfully', async () => {
            const app = new Hono();
            app.use('/api/progress-items/*', mockAuthMiddleware);
            app.post('/api/progress-items', controller.create());

            (mockService.create as Mock).mockResolvedValue(mockItem);

            const inputData = {
                title: 'Test Item',
                importance: 'high',
                urgency: 'high',
                activeDays: ['mon', 'wed'],
            };

            const response = await app.request('/api/progress-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(inputData),
            });

            expect(response.status).toBe(201);
            const json = await response.json();
            expect(json.code).toBe('S001');
            expect(json.data).toEqual({ ...mockItem, createdAt: mockDate.toISOString(), updatedAt: mockDate.toISOString() });
            expect(mockService.create).toHaveBeenCalledWith('user-123', inputData);
        });

        it('should return 400 on validation error', async () => {
            const app = new Hono();
            app.use('/api/progress-items/*', mockAuthMiddleware);
            app.post('/api/progress-items', controller.create());

            (mockService.create as Mock).mockRejectedValue(new ValidationError('Invalid importance'));

            const inputData = {
                title: 'Test Item',
                importance: 'invalid',
                urgency: 'high',
                activeDays: ['mon'],
            };

            const response = await app.request('/api/progress-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(inputData),
            });

            expect(response.status).toBe(400);
            const json = await response.json();
            expect(json.code).toBe('E003');
        });
    });

    describe('POST /api/progress-items/:id/logs', () => {
        it('should log progress successfully', async () => {
            const app = new Hono();
            app.use('/api/progress-items/*', mockAuthMiddleware);
            app.post('/api/progress-items/:id/logs', controller.logProgress());

            const mockLog: ProgressLog = {
                id: 'log-1',
                progressItemId: 'item-123',
                loggedAt: mockDate,
                note: 'Done',
                isOffDay: false,
                createdAt: mockDate,
            };

            (mockService.logProgress as Mock).mockResolvedValue(mockLog);

            const inputData = {
                loggedAt: mockDate.toISOString(),
                note: 'Done',
            };

            const response = await app.request('/api/progress-items/item-123/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(inputData),
            });

            expect(response.status).toBe(201);
            const json = await response.json();
            expect(json.data).toEqual({ ...mockLog, loggedAt: mockDate.toISOString(), createdAt: mockDate.toISOString() });
            expect(mockService.logProgress).toHaveBeenCalledWith('user-123', 'item-123', {
                loggedAt: inputData.loggedAt,
                note: 'Done'
            });
        });

        it('should return 404 if item not found', async () => {
            const app = new Hono();
            app.use('/api/progress-items/*', mockAuthMiddleware);
            app.post('/api/progress-items/:id/logs', controller.logProgress());

            (mockService.logProgress as Mock).mockRejectedValue(new NotFoundError('Item not found'));

            const response = await app.request('/api/progress-items/non-existent/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ loggedAt: new Date().toISOString() }),
            });

            expect(response.status).toBe(404);
            const json = await response.json();
            expect(json.code).toBe('E003');
        });
    });

    describe('GET /api/progress-items', () => {
        it('should return paginated items', async () => {
            const app = new Hono();
            app.use('/api/progress-items/*', mockAuthMiddleware);
            app.get('/api/progress-items', controller.getAll());

            const mockResult = {
                items: [mockItem],
                total: 1
            };

            (mockService.getAll as Mock).mockResolvedValue(mockResult);

            const response = await app.request('/api/progress-items?page=1&limit=10', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.code).toBe('S001');
            expect(json.data.data).toEqual([{ ...mockItem, createdAt: mockDate.toISOString(), updatedAt: mockDate.toISOString() }]);
            expect(json.data.pagination).toEqual({
                total: 1,
                perPage: 10,
                currentPage: 1,
                lastPage: 1
            });
            expect(mockService.getAll).toHaveBeenCalledWith('user-123', { page: 1, limit: 10, activeDay: undefined });
        });
    });

    describe('PUT /api/progress-items/:id', () => {
        it('should update item successfully', async () => {
            const app = new Hono();
            app.use('/api/progress-items/*', mockAuthMiddleware);
            app.put('/api/progress-items/:id', controller.update());

            const updatedItem = { ...mockItem, title: 'Updated Title' };
            (mockService.update as Mock).mockResolvedValue(updatedItem);

            const inputData = { title: 'Updated Title' };

            const response = await app.request('/api/progress-items/item-123', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inputData)
            });

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data).toEqual({ ...updatedItem, createdAt: mockDate.toISOString(), updatedAt: mockDate.toISOString() });
            expect(mockService.update).toHaveBeenCalledWith('user-123', 'item-123', inputData);
        });

        it('should return 400 on validation error', async () => {
            const app = new Hono();
            app.use('/api/progress-items/*', mockAuthMiddleware);
            app.put('/api/progress-items/:id', controller.update());

            (mockService.update as Mock).mockRejectedValue(new ValidationError('Invalid importance'));

            const response = await app.request('/api/progress-items/item-123', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ importance: 'invalid' })
            });

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/progress-items/:id/settle', () => {
        it('should settle item successfully', async () => {
            const app = new Hono();
            app.use('/api/progress-items/*', mockAuthMiddleware);
            app.put('/api/progress-items/:id/settle', controller.settle());

            const settledItem = { ...mockItem, status: 'settled' };
            (mockService.settle as Mock).mockResolvedValue(settledItem);

            const response = await app.request('/api/progress-items/item-123/settle', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.status).toBe('settled');
            expect(mockService.settle).toHaveBeenCalledWith('user-123', 'item-123');
        });
    });

    describe('GET /api/progress-items/:id/logs', () => {
        it('should return paginated logs', async () => {
            const app = new Hono();
            app.use('/api/progress-items/*', mockAuthMiddleware);
            app.get('/api/progress-items/:id/logs', controller.getLogs());

            const mockLog: ProgressLog = {
                id: 'log-1',
                progressItemId: 'item-123',
                loggedAt: mockDate,
                note: 'Done',
                isOffDay: false,
                createdAt: mockDate,
            };

            const mockResult = {
                logs: [mockLog],
                total: 1
            };

            (mockService.getLogs as Mock).mockResolvedValue(mockResult);

            const response = await app.request('/api/progress-items/item-123/logs?page=1&limit=10', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.code).toBe('S001');
            expect(json.data.data).toHaveLength(1);
            expect(json.data.pagination).toEqual({
                total: 1,
                perPage: 10,
                currentPage: 1,
                lastPage: 1
            });
            expect(mockService.getLogs).toHaveBeenCalledWith('user-123', 'item-123', { page: 1, limit: 10 });
        });

        it('should return 404 if item not found for logs', async () => {
            const app = new Hono();
            app.use('/api/progress-items/*', mockAuthMiddleware);
            app.get('/api/progress-items/:id/logs', controller.getLogs());

            (mockService.getLogs as Mock).mockRejectedValue(new NotFoundError('Item not found'));

            const response = await app.request('/api/progress-items/non-existent/logs', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.status).toBe(404);
        });
    });
});
