import { Container } from '../../../shared/container';
import type { DatabaseService } from '../../../shared/database/database.service';

/**
 * Timeline Event Repository
 *
 * Handles data access for timeline events using Prisma
 */
export class TimelineEventRepository {
    private db: any;

    constructor(container: Container) {
        const databaseService = container.resolve('DatabaseService') as any;
        this.db = databaseService.client;
    }

    /**
     * Create a new timeline event
     */
    async create(data: {
        userId: string;
        title: string;
        startTime: Date;
        durationMinutes?: number;
        recurrencePattern?: 'daily' | 'weekly' | null;
        daysOfWeek?: string[] | null;
    }) {
        const createData: any = {
            userId: data.userId,
            title: data.title,
            startTime: data.startTime,
            status: 'active',
        };

        if (data.durationMinutes !== undefined) {
            createData.durationMinutes = data.durationMinutes;
        }

        if (data.recurrencePattern !== undefined) {
            createData.recurrencePattern = data.recurrencePattern;
        }

        if (data.daysOfWeek !== undefined) {
            createData.daysOfWeek = data.daysOfWeek;
        } else if (data.recurrencePattern !== undefined) {
            // If daysOfWeek is not provided but recurrencePattern is, set daysOfWeek to null
            createData.daysOfWeek = null;
        }

        return this.db.timelineEvent.create({
            data: createData,
        });
    }

    /**
     * Find an event by ID
     */
    async findById(eventId: string) {
        return this.db.timelineEvent.findUnique({
            where: { id: eventId },
        });
    }

    /**
     * Find all events for a user
     */
    async findByUserId(userId: string) {
        return this.db.timelineEvent.findMany({
            where: { userId },
            orderBy: { startTime: 'asc' },
        });
    }

    /**
     * Update an event
     */
    async update(eventId: string, data: {
        title?: string;
        startTime?: Date;
        durationMinutes?: number;
        recurrencePattern?: 'daily' | 'weekly' | null;
        daysOfWeek?: string[] | null;
    }) {
        return this.db.timelineEvent.update({
            where: { id: eventId },
            data,
        });
    }

    /**
     * Delete an event
     */
    async delete(eventId: string) {
        return this.db.timelineEvent.delete({
            where: { id: eventId },
        });
    }

    /**
     * Check if an event occurs on a specific date
     *
     * Rules:
     * - If status is 'settled', return false
     * - If recurrencePattern is 'daily', return true
     * - If recurrencePattern is 'weekly', check if date's day is in daysOfWeek
     * - If no recurrencePattern (one-time), check if date matches startTime
     */
    occursOnDate(event: any, date: Date): boolean {
        // Settled events don't occur on any date
        if (event.status === 'settled') {
            return false;
        }

        // Daily recurrence - occurs every day
        if (event.recurrencePattern === 'daily') {
            return true;
        }

        // Weekly recurrence - occurs on specified days
        if (event.recurrencePattern === 'weekly') {
            if (!event.daysOfWeek || event.daysOfWeek.length === 0) {
                return false;
            }
            const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
            const dayName = dayNames[date.getDay()];
            return event.daysOfWeek.map((d: string) => d.toLowerCase()).includes(dayName);
        }

        // One-time event - check if date matches startTime
        const eventDate = new Date(event.startTime);
        return (
            eventDate.getFullYear() === date.getFullYear() &&
            eventDate.getMonth() === date.getMonth() &&
            eventDate.getDate() === date.getDate()
        );
    }
}
