import { Container } from '../../shared/container';

interface TimelineEvent {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    description?: string | null;
    recurrencePattern?: string | null;
}

interface ProgressItem {
    id: string;
    title: string;
    importance: string;
    urgency: string;
    activeDays: string[];
    deadline: Date | null;
    status: string;
}

interface Commitment {
    id: string;
    title: string;
    scheduledDays: string[];
    logs: Array<{
        id: string;
        completedAt: Date;
    }>;
}

interface DashboardData {
    timeline: {
        events: TimelineEvent[];
    };
    progressItems: {
        important: {
            urgent: ProgressItem[];
            notUrgent: ProgressItem[];
        };
        notImportant: {
            urgent: ProgressItem[];
            notUrgent: ProgressItem[];
        };
    };
    commitments: Array<{
        id: string;
        title: string;
        scheduledDays: string[];
        completedToday: boolean;
        completionCount: number;
    }>;
}

interface CommitmentWithStatus extends Commitment {
    completedToday: boolean;
    completionCount: number;
}

export class DashboardService {
    private timelineEventService: any;
    private progressItemService: any;
    private commitmentService: any;

    constructor(container: Container) {
        this.timelineEventService = container.resolve('TimelineEventService');
        this.progressItemService = container.resolve('ProgressItemService');
        this.commitmentService = container.resolve('CommitmentService');
    }

    /**
     * Convert date string to day of week abbreviation
     * @param dateStr - Date string in YYYY-MM-DD format
     * @returns Day abbreviation (sun, mon, tue, wed, thu, fri, sat)
     */
    private getDayOfWeek(dateStr: string): string {
        const date = new Date(dateStr);
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return days[date.getDay()];
    }

    /**
     * Check if a date string is valid
     * @param dateStr - Date string to validate
     * @returns true if valid, false otherwise
     */
    private isValidDate(dateStr: string): boolean {
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    }

    /**
     * Group progress items by Eisenhower Matrix quadrants
     * @param items - Progress items to group
     * @returns Grouped items by importance and urgency
     */
    private groupByEisenhowerQuadrant(items: ProgressItem[]) {
        return {
            important: {
                urgent: items.filter(i => i.importance === 'high' && i.urgency === 'high'),
                notUrgent: items.filter(i => i.importance === 'high' && i.urgency === 'low'),
            },
            notImportant: {
                urgent: items.filter(i => i.importance === 'low' && i.urgency === 'high'),
                notUrgent: items.filter(i => i.importance === 'low' && i.urgency === 'low'),
            },
        };
    }

    /**
     * Filter commitments by scheduled days and add completion status
     * @param commitments - All commitments for user
     * @param dayOfWeek - Current day of week
     * @param dateStr - Current date string
     * @returns Filtered commitments with completion status
     */
    private filterAndEnrichCommitments(commitments: Commitment[], dayOfWeek: string, dateStr: string): CommitmentWithStatus[] {
        const targetDate = new Date(dateStr);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        return commitments
            .filter(commitment => commitment.scheduledDays.includes(dayOfWeek))
            .map(commitment => {
                // Count total logs
                const completionCount = commitment.logs.length;

                // Check if completed today
                const completedToday = commitment.logs.some(log => {
                    const logDate = new Date(log.completedAt);
                    return logDate >= startOfDay && logDate <= endOfDay;
                });

                return {
                    ...commitment,
                    completedToday,
                    completionCount,
                };
            });
    }

    /**
     * Enrich timeline events with computed endTime
     * @param events - Raw timeline events from the service
     * @returns Events with computed endTime and description fields
     */
    private enrichTimelineEvents(events: any[]): TimelineEvent[] {
        return events.map(event => {
            const startTime = new Date(event.startTime);
            const durationMinutes = event.durationMinutes || 30;
            const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

            return {
                id: event.id,
                title: event.title,
                startTime: event.startTime,
                endTime,
                durationMinutes,
                description: event.description || null,
                recurrencePattern: event.recurrencePattern || null,
            };
        });
    }

    /**
     * Get aggregated dashboard data for a specific date
     * @param userId - User ID
     * @param dateStr - Date string in YYYY-MM-DD format
     * @returns Aggregated dashboard data
     */
    async getDashboardData(userId: string, dateStr: string): Promise<DashboardData> {
        // Validate date
        if (!this.isValidDate(dateStr)) {
            throw new Error('Invalid date');
        }

        const dayOfWeek = this.getDayOfWeek(dateStr);

        // Fetch data from all services in parallel
        const [timelineEvents, progressItemsResult, allCommitments] = await Promise.all([
            this.timelineEventService.getEventsForDate(userId, dateStr),
            this.progressItemService.getAll(userId, { activeDay: dayOfWeek }),
            this.commitmentService.getCommitments(userId),
        ]);

        // Enrich timeline events with computed endTime
        const enrichedEvents = this.enrichTimelineEvents(timelineEvents);

        // Extract progress items data
        const progressItems = progressItemsResult.data || [];

        // Group progress items by Eisenhower Matrix
        const groupedProgressItems = this.groupByEisenhowerQuadrant(progressItems);

        // Filter and enrich commitments
        const commitments = this.filterAndEnrichCommitments(allCommitments, dayOfWeek, dateStr);

        return {
            timeline: {
                events: enrichedEvents,
            },
            progressItems: groupedProgressItems,
            commitments,
        };
    }
}
