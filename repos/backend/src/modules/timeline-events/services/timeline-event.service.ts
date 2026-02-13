import { Container } from '../../../shared/container';
import { TimelineEventRepository } from '../repositories/timeline-event.repository';

export interface CreateTimelineEventRequest {
    title: string;
    startTime: string;
    durationMinutes?: number;
    recurrencePattern?: 'daily' | 'weekly';
    daysOfWeek?: string[];
}

export interface UpdateTimelineEventRequest {
    title?: string;
    startTime?: string;
    durationMinutes?: number;
    recurrencePattern?: 'daily' | 'weekly';
    daysOfWeek?: string[];
}

const VALID_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const VALID_RECURRENCE_PATTERNS = ['daily', 'weekly'];

export class TimelineEventService {
    private timelineEventRepository: TimelineEventRepository;

    constructor(container: Container) {
        this.timelineEventRepository = container.resolve('TimelineEventRepository') as TimelineEventRepository;
    }

    private validateRecurrencePattern(recurrencePattern: 'daily' | 'weekly' | undefined, daysOfWeek?: string[]): void {
        if (recurrencePattern !== undefined && !VALID_RECURRENCE_PATTERNS.includes(recurrencePattern)) {
            throw new Error('Invalid recurrence pattern');
        }

        if (recurrencePattern === 'daily' && daysOfWeek && daysOfWeek.length > 0) {
            throw new Error('daysOfWeek can only be provided with weekly recurrence');
        }

        if (recurrencePattern === 'weekly') {
            if (!daysOfWeek) {
                throw new Error('daysOfWeek is required for weekly recurrence');
            }
            if (daysOfWeek.length === 0) {
                throw new Error('daysOfWeek must contain at least one day');
            }
            const invalidDays = daysOfWeek.filter(day => !VALID_DAYS.includes(day.toLowerCase()));
            if (invalidDays.length > 0) {
                throw new Error('Invalid day names in daysOfWeek');
            }
        }
    }

    private validateTitle(title: string): void {
        if (!title || title.trim().length === 0) {
            throw new Error('Title is required');
        }
    }

    private validateDuration(durationMinutes: number): void {
        if (durationMinutes <= 0) {
            throw new Error('Duration must be positive');
        }
    }

    private validateStartTime(startTime: string): Date {
        const date = new Date(startTime);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid start time');
        }
        return date;
    }

    async create(userId: string, data: CreateTimelineEventRequest): Promise<any> {
        this.validateTitle(data.title);
        const startTime = this.validateStartTime(data.startTime);

        const durationMinutes = data.durationMinutes ?? 30;
        this.validateDuration(durationMinutes);

        this.validateRecurrencePattern(data.recurrencePattern, data.daysOfWeek);

        const createData: any = {
            userId,
            title: data.title,
            startTime,
        };

        if (data.durationMinutes !== undefined) {
            createData.durationMinutes = data.durationMinutes;
        }

        if (data.recurrencePattern) {
            createData.recurrencePattern = data.recurrencePattern;
        }

        if (data.daysOfWeek) {
            createData.daysOfWeek = data.daysOfWeek;
        }

        return this.timelineEventRepository.create(createData);
    }

    async getEventsForDate(userId: string, date: string): Promise<any[]> {
        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            throw new Error('Invalid date');
        }

        const allEvents = await this.timelineEventRepository.findByUserId(userId);

        // Filter events that occur on the target date
        const eventsForDate = allEvents.filter(event =>
            this.timelineEventRepository.occursOnDate(event, targetDate)
        );

        // Sort by start time
        return eventsForDate.sort((a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
    }

    async getById(userId: string, eventId: string): Promise<any | null> {
        const event = await this.timelineEventRepository.findById(eventId);

        if (!event || event.userId !== userId) {
            return null;
        }

        return event;
    }

    async update(userId: string, eventId: string, data: UpdateTimelineEventRequest): Promise<any> {
        const event = await this.timelineEventRepository.findById(eventId);
        if (!event || event.userId !== userId) {
            throw new Error('Timeline event not found');
        }

        if (data.title !== undefined) {
            this.validateTitle(data.title);
        }

        if (data.startTime !== undefined) {
            this.validateStartTime(data.startTime);
        }

        if (data.durationMinutes !== undefined) {
            this.validateDuration(data.durationMinutes);
        }

        if (data.recurrencePattern !== undefined || data.daysOfWeek !== undefined) {
            const recurrencePattern = data.recurrencePattern ?? event.recurrencePattern;
            const daysOfWeek = data.daysOfWeek ?? event.daysOfWeek;
            this.validateRecurrencePattern(recurrencePattern as any, daysOfWeek);
        }

        const updateData: any = {};
        if (data.title !== undefined) {
            updateData.title = data.title;
        }
        if (data.startTime !== undefined) {
            updateData.startTime = new Date(data.startTime);
        }
        if (data.durationMinutes !== undefined) {
            updateData.durationMinutes = data.durationMinutes;
        }
        if (data.recurrencePattern !== undefined) {
            updateData.recurrencePattern = data.recurrencePattern;
        }
        if (data.daysOfWeek !== undefined) {
            updateData.daysOfWeek = data.daysOfWeek;
        }

        return this.timelineEventRepository.update(eventId, updateData);
    }

    async delete(userId: string, eventId: string): Promise<void> {
        const event = await this.timelineEventRepository.findById(eventId);
        if (!event || event.userId !== userId) {
            throw new Error('Timeline event not found');
        }

        await this.timelineEventRepository.delete(eventId);
    }

    occursOnDate(event: any, date: Date): boolean {
        return this.timelineEventRepository.occursOnDate(event, date);
    }
}
