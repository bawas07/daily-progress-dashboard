import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ProgressItemService, ValidationError, NotFoundError, DateProvider } from '../../../../src/modules/progress-items/services/progress-item.service';
import { ProgressItemRepository } from '../../../../src/modules/progress-items/repositories/progress-item.repository';
import { ProgressLogRepository } from '../../../../src/modules/progress-items/repositories/progress-log.repository';
import { ProgressItem, ProgressLog } from '@prisma/client';
import { Container } from '../../../../src/shared/container';

describe('ProgressItemService', () => {
    let itemRepository: ProgressItemRepository;
    let logRepository: ProgressLogRepository;
    let dateProvider: DateProvider;
    let service: ProgressItemService;

    const mockDate = new Date('2024-01-01T12:00:00Z');

    const mockItem: ProgressItem = {
        id: 'item-123',
        userId: 'user-123',
        title: 'Test Item',
        importance: 'high',
        urgency: 'high',
        activeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        deadline: null,
        status: 'active',
        createdAt: mockDate,
        updatedAt: mockDate,
    };

    beforeEach(() => {
        itemRepository = {
            create: vi.fn(),
            findById: vi.fn(),
            findAll: vi.fn(),
            settle: vi.fn(),
            count: vi.fn(),
            update: vi.fn(),
        } as unknown as ProgressItemRepository;

        logRepository = {
            create: vi.fn(),
            findByItemId: vi.fn(),
            countByItemId: vi.fn(),
        } as unknown as ProgressLogRepository;

        dateProvider = {
            now: vi.fn().mockReturnValue(new Date()),
        };

        // We need to mock how the service gets repositories if checking strictly via container or constructor
        // But here we are injecting mocks directly
        service = new ProgressItemService(itemRepository, logRepository, dateProvider);
    });

    describe('create', () => {
        it('should create item and classify as Important & Urgent (Do)', async () => {
            const createData = {
                title: 'Important Task',
                importance: 'high',
                urgency: 'high',
                activeDays: ['mon'],
            };

            (itemRepository.create as Mock).mockResolvedValue({
                ...mockItem,
                ...createData,
            });

            const result = await service.create('user-123', createData);

            expect(itemRepository.create).toHaveBeenCalledWith({
                userId: 'user-123',
                ...createData,
                deadline: null,
                status: 'active',
            });
            expect(result).toBeDefined();
        });

        it('should validate importance values', async () => {
            const createData = {
                title: 'Task',
                importance: 'invalid',
                urgency: 'high',
                activeDays: ['mon'],
            };

            await expect(service.create('user-123', createData)).rejects.toThrow(ValidationError);
        });

        it('should validate urgency values', async () => {
            const createData = {
                title: 'Task',
                importance: 'high',
                urgency: 'invalid',
                activeDays: ['mon'],
            };

            await expect(service.create('user-123', createData)).rejects.toThrow(ValidationError);
        });
    });

    describe('logProgress', () => {
        it('should detect off-day when today is not in activeDays', async () => {
            // Jan 6, 2024 was a Saturday
            const satDate = new Date('2024-01-06T12:00:00Z');
            (dateProvider.now as Mock).mockReturnValue(satDate);

            (itemRepository.findById as Mock).mockResolvedValue(mockItem); // activeDays: mon-fri

            const logData = {
                loggedAt: satDate,
                note: 'Weekend work',
            };

            (logRepository.create as Mock).mockResolvedValue({
                id: 'log-1',
                progressItemId: mockItem.id,
                ...logData,
                isOffDay: true,
                createdAt: satDate,
            });

            await service.logProgress('user-123', 'item-123', logData);

            expect(logRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                isOffDay: true,
            }));
        });

        it('should NOT mark as off-day when today IS in activeDays', async () => {
            // Jan 1, 2024 was a Monday (active day)
            const monDate = new Date('2024-01-01T12:00:00Z');
            (dateProvider.now as Mock).mockReturnValue(monDate);

            (itemRepository.findById as Mock).mockResolvedValue(mockItem); // activeDays: mon-fri

            const logData = {
                loggedAt: monDate,
                note: 'Monday work',
            };

            (logRepository.create as Mock).mockResolvedValue({
                id: 'log-1',
                progressItemId: mockItem.id,
                ...logData,
                isOffDay: false,
                createdAt: monDate,
            });

            const activeDays = mockItem.activeDays as string[];

            await service.logProgress('user-123', 'item-123', logData);

            expect(logRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                isOffDay: false,
            }));
        });

        it('should throw validation error if note exceeds 1000 chars', async () => {
            (itemRepository.findById as Mock).mockResolvedValue(mockItem);

            const longNote = 'a'.repeat(1001);
            const logData = {
                loggedAt: new Date(),
                note: longNote,
            };

            await expect(service.logProgress('user-123', 'item-123', logData)).rejects.toThrow(ValidationError);
        });

        it('should throw not found error if item does not exist', async () => {
            (itemRepository.findById as Mock).mockResolvedValue(null);

            await expect(service.logProgress('user-123', 'non-existent', { loggedAt: new Date() }))
                .rejects.toThrow(NotFoundError);
        });

        it('should throw not found error if item belongs to another user', async () => {
            (itemRepository.findById as Mock).mockResolvedValue({
                ...mockItem,
                userId: 'other-user',
            });

            await expect(service.logProgress('user-123', 'item-123', { loggedAt: new Date() }))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('getAll', () => {
        it('should return paginated items', async () => {
            const items = [mockItem];
            (itemRepository.findAll as Mock).mockResolvedValue(items);
            (itemRepository.count as Mock).mockResolvedValue(1);

            const result = await service.getAll('user-123', { page: 1, limit: 10 });

            expect(result).toEqual({ items, total: 1 });
            expect(itemRepository.findAll).toHaveBeenCalledWith('user-123', { skip: 0, take: 10, activeDay: undefined });
        });
    });

    describe('update', () => {
        it('should update item successfully', async () => {
            (itemRepository.findById as Mock).mockResolvedValue(mockItem);
            (itemRepository.update as Mock).mockResolvedValue({ ...mockItem, title: 'Updated' });

            const result = await service.update('user-123', 'item-123', { title: 'Updated' });

            expect(result.title).toBe('Updated');
            expect(itemRepository.update).toHaveBeenCalledWith('item-123', expect.objectContaining({ title: 'Updated' }));
        });

        it('should throw validation error for invalid importance', async () => {
            (itemRepository.findById as Mock).mockResolvedValue(mockItem);
            await expect(service.update('user-123', 'item-123', { importance: 'invalid' })).rejects.toThrow(ValidationError);
        });

        it('should throw not found if item does not exist', async () => {
            (itemRepository.findById as Mock).mockResolvedValue(null);
            await expect(service.update('user-123', 'non-existent', {})).rejects.toThrow(NotFoundError);
        });
    });

    describe('settle', () => {
        it('should settle item', async () => {
            (itemRepository.findById as Mock).mockResolvedValue(mockItem);
            (itemRepository.settle as Mock).mockResolvedValue({ ...mockItem, status: 'settled' });

            const result = await service.settle('user-123', 'item-123');

            expect(result.status).toBe('settled');
            expect(itemRepository.settle).toHaveBeenCalledWith('item-123');
        });
    });

    describe('getLogs', () => {
        it('should return logs', async () => {
            (itemRepository.findById as Mock).mockResolvedValue(mockItem);
            (logRepository.findByItemId as Mock).mockResolvedValue([]);
            (logRepository.countByItemId as Mock).mockResolvedValue(0);

            const result = await service.getLogs('user-123', 'item-123');

            expect(result).toEqual({ logs: [], total: 0 });
        });
    });
});
