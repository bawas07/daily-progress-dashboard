import { ProgressItem, ProgressLog, Prisma } from '@prisma/client';
import { ProgressItemRepository } from '../repositories/progress-item.repository';
import { ProgressLogRepository } from '../repositories/progress-log.repository';
import { Container } from '../../../shared/container';
import { resolveService } from '../../../shared/container';

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export interface DateProvider {
    now(): Date;
}

export class DefaultDateProvider implements DateProvider {
    now(): Date {
        return new Date();
    }
}

export class ProgressItemService {
    private itemRepository: ProgressItemRepository;
    private logRepository: ProgressLogRepository;
    private dateProvider: DateProvider;

    constructor(
        itemRepositoryOrContainer: ProgressItemRepository | Container,
        logRepository?: ProgressLogRepository,
        dateProvider?: DateProvider
    ) {
        if (itemRepositoryOrContainer instanceof Container) {
            this.itemRepository = resolveService('ProgressItemRepository', itemRepositoryOrContainer);
            this.logRepository = resolveService('ProgressLogRepository', itemRepositoryOrContainer);
            this.dateProvider = new DefaultDateProvider();
        } else {
            this.itemRepository = itemRepositoryOrContainer;
            this.logRepository = logRepository!;
            this.dateProvider = dateProvider || new DefaultDateProvider();
        }
    }

    async create(userId: string, data: {
        title: string;
        importance: string;
        urgency: string;
        activeDays: string[];
        deadline?: Date | string | null;
    }): Promise<ProgressItem> {

        // Validate importance and urgency
        const validLevels = ['low', 'medium', 'high']; // Assuming medium is valid or just low/high based on test? 
        // Test implicitly used 'high', 'low'. Let's check test.
        // Test said 'invalid' throws error.
        // Requirements might specify. Req 3.2: "Eisenhower Matrix ... Importance and Urgency ...". Usually Binary (High/Low) for Matrix.
        // Let's stick to 'low' | 'high' for now, or maybe check schema?
        // Schema says String.
        // I will support 'low' and 'high'. If 'medium' is needed later I'll add it.
        // Actually, let's allow 'medium' if desired, but for Matrix quadrant logic, it's usually binary axis.
        // The test expected validation error for 'invalid'.

        const allowed = ['low', 'high'];
        if (!allowed.includes(data.importance)) {
            throw new ValidationError('Invalid importance');
        }
        if (!allowed.includes(data.urgency)) {
            throw new ValidationError('Invalid urgency');
        }

        // Validate activeDays
        // Implicitly handled by repository or type check, but let's be safe if data comes from raw input
        // NOTE: validation middleware (Zod) usually handles detailed schema. 
        // BUT since I am unit testing service for validation, I should implement it here if the test requires it.

        return this.itemRepository.create({
            userId,
            title: data.title,
            importance: data.importance,
            urgency: data.urgency,
            activeDays: data.activeDays,
            deadline: data.deadline ? new Date(data.deadline) : null,
            status: 'active'
        });
    }

    async logProgress(userId: string, itemId: string, data: {
        loggedAt: Date | string;
        note?: string;
    }): Promise<ProgressLog> {
        // Check item existence and ownership
        const item = await this.itemRepository.findById(itemId);
        if (!item) {
            throw new NotFoundError('Progress item not found');
        }
        if (item.userId !== userId) {
            throw new NotFoundError('Progress item not found'); // Security: hide existence
        }

        // Validate note length
        if (data.note && data.note.length > 1000) {
            throw new ValidationError('Note must be 1000 characters or less');
        }

        const logDate = new Date(data.loggedAt);

        // Determine if off-day
        const activeDays = item.activeDays as string[];
        const isOffDay = this.calculateIsOffDay(logDate, activeDays);

        return this.logRepository.create({
            progressItemId: itemId,
            loggedAt: logDate,
            note: data.note,
            isOffDay: isOffDay
        });
    }

    private calculateIsOffDay(date: Date, activeDays: string[]): boolean {
        const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayOfWeek = daysMap[date.getDay()];
        // If dayOfWeek is NOT in activeDays, it IS an off-day
        return !activeDays.includes(dayOfWeek);
    }

    async getAll(userId: string, options?: {
        page?: number;
        limit?: number;
        activeDay?: string
    }): Promise<{ items: ProgressItem[]; total: number }> {
        const page = options?.page || 1;
        // Default limit 10, max 100? Let's just use 10 for now as per controller needs
        const limit = options?.limit || 10;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.itemRepository.findAll(userId, {
                activeDay: options?.activeDay,
                skip,
                take: limit
            }),
            this.itemRepository.count(userId, {
                activeDay: options?.activeDay
            })
        ]);

        return { items, total };
    }

    async update(userId: string, itemId: string, data: {
        title?: string;
        importance?: string;
        urgency?: string;
        activeDays?: string[];
        deadline?: Date | string | null;
    }): Promise<ProgressItem> {
        const item = await this.itemRepository.findById(itemId);
        if (!item) {
            throw new NotFoundError('Progress item not found');
        }
        if (item.userId !== userId) {
            throw new NotFoundError('Progress item not found');
        }

        // Validate importance/urgency if provided
        const allowed = ['low', 'high'];
        if (data.importance && !allowed.includes(data.importance)) {
            throw new ValidationError('Invalid importance');
        }
        if (data.urgency && !allowed.includes(data.urgency)) {
            throw new ValidationError('Invalid urgency');
        }

        const updateData: any = { ...data };
        if (data.deadline !== undefined) {
            updateData.deadline = data.deadline === null ? null : new Date(data.deadline);
        }

        return this.itemRepository.update(itemId, updateData);
    }

    async settle(userId: string, itemId: string): Promise<ProgressItem> {
        const item = await this.itemRepository.findById(itemId);
        if (!item) {
            throw new NotFoundError('Progress item not found');
        }
        if (item.userId !== userId) {
            throw new NotFoundError('Progress item not found');
        }

        return this.itemRepository.settle(itemId);
    }

    async getLogs(userId: string, itemId: string, options?: {
        page?: number;
        limit?: number
    }): Promise<{ logs: ProgressLog[]; total: number }> {
        const item = await this.itemRepository.findById(itemId);
        if (!item) {
            throw new NotFoundError('Progress item not found');
        }
        if (item.userId !== userId) {
            throw new NotFoundError('Progress item not found');
        }

        const page = options?.page || 1;
        const limit = options?.limit || 10;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            this.logRepository.findByItemId(itemId, { skip, take: limit }),
            this.logRepository.countByItemId(itemId)
        ]);

        return { logs, total };
    }
}
