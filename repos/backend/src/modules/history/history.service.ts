import { Container, resolveService } from '../../shared/container';
import { ProgressItemRepository } from '../progress-items/repositories/progress-item.repository';
import { ProgressLogRepository } from '../progress-items/repositories/progress-log.repository';
import { CommitmentRepository } from '../commitment/repositories/commitment.repository';
import { CommitmentLogRepository } from '../commitment/repositories/commitment-log.repository';

interface ProgressLogWithItem {
    id: string;
    progressItemId: string;
    loggedAt: Date;
    note: string | null;
    isOffDay: boolean;
    progressItem: {
        id: string;
        title: string;
        importance: string;
        urgency: string;
    };
}

interface CommitmentLogWithCommitment {
    id: string;
    commitmentId: string;
    completedAt: Date;
    note: string | null;
    commitment: {
        id: string;
        title: string;
        scheduledDays: string[];
    };
}

export class HistoryService {
    private progressItemRepository: ProgressItemRepository;
    private progressLogRepository: ProgressLogRepository;
    private commitmentRepository: CommitmentRepository;
    private commitmentLogRepository: CommitmentLogRepository;

    constructor(container: Container) {
        this.progressItemRepository = resolveService<ProgressItemRepository>('ProgressItemRepository', container);
        this.progressLogRepository = resolveService<ProgressLogRepository>('ProgressLogRepository', container);
        this.commitmentRepository = resolveService<CommitmentRepository>('CommitmentRepository', container);
        this.commitmentLogRepository = resolveService<CommitmentLogRepository>('CommitmentLogRepository', container);
    }

    /**
     * Validate date string
     */
    private isValidDate(dateStr: string): boolean {
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    }

    /**
     * Get date boundaries for a given date (start and end of day)
     */
    private getDateBoundaries(dateStr: string): { start: Date; end: Date } {
        const date = new Date(dateStr);
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    /**
     * Get day of week from date string
     */
    private getDayOfWeek(dateStr: string): string {
        const date = new Date(dateStr);
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return days[date.getDay()];
    }

    /**
     * Get today's history (progress logs and commitment logs for the specified date)
     */
    async getTodayHistory(userId: string, date: string) {
        if (!this.isValidDate(date)) {
            throw new Error('Invalid date');
        }

        const { start, end } = this.getDateBoundaries(date);

        const [progressLogs, commitmentLogs] = await Promise.all([
            this.progressLogRepository.findByDate(userId, start, end) as Promise<ProgressLogWithItem[]>,
            this.commitmentLogRepository.findByDateRange(userId, start, end) as Promise<CommitmentLogWithCommitment[]>,
        ]);

        return {
            progressLogs,
            commitmentLogs,
            summary: {
                progressLogCount: progressLogs.length,
                commitmentLogCount: commitmentLogs.length,
            },
        };
    }

    /**
     * Get weekly history (logs grouped by day from Monday to Sunday)
     */
    async getWeeklyHistory(userId: string, date: string) {
        if (!this.isValidDate(date)) {
            throw new Error('Invalid date');
        }

        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay();

        // Calculate Monday of the week
        const monday = new Date(targetDate);
        monday.setDate(targetDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);

        // Calculate Sunday of the week
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Fetch all logs for the week
        const [progressLogs, commitmentLogs] = await Promise.all([
            this.progressLogRepository.findByDate(userId, monday, sunday) as Promise<ProgressLogWithItem[]>,
            this.commitmentLogRepository.findByDateRange(userId, monday, sunday) as Promise<CommitmentLogWithCommitment[]>,
        ]);

        // Group logs by date
        const weeklyData: Record<string, any> = {};

        // Initialize all days of the week
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + i);
            const dateKey = dayDate.toISOString().split('T')[0];
            weeklyData[dateKey] = {
                progressLogs: [],
                commitmentLogs: [],
            };
        }

        // Group progress logs by date
        progressLogs.forEach((log) => {
            const dateKey = new Date(log.loggedAt).toISOString().split('T')[0];
            if (weeklyData[dateKey]) {
                weeklyData[dateKey].progressLogs.push(log);
            }
        });

        // Group commitment logs by date
        commitmentLogs.forEach((log) => {
            const dateKey = new Date(log.completedAt).toISOString().split('T')[0];
            if (weeklyData[dateKey]) {
                weeklyData[dateKey].commitmentLogs.push(log);
            }
        });

        // Calculate summary
        const totalProgressLogs = progressLogs.length;
        const totalCommitmentLogs = commitmentLogs.length;

        return {
            weeklyData,
            summary: {
                totalProgressLogs,
                totalCommitmentLogs,
            },
        };
    }

    /**
     * Get monthly history (logs grouped by day for the entire month)
     */
    async getMonthlyHistory(userId: string, date: string) {
        if (!this.isValidDate(date)) {
            throw new Error('Invalid date');
        }

        const targetDate = new Date(date);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        // Calculate first day of month
        const firstDay = new Date(year, month, 1);
        firstDay.setHours(0, 0, 0, 0);

        // Calculate last day of month
        const lastDay = new Date(year, month + 1, 0);
        lastDay.setHours(23, 59, 59, 999);

        // Fetch all logs for the month
        const [progressLogs, commitmentLogs] = await Promise.all([
            this.progressLogRepository.findByDate(userId, firstDay, lastDay) as Promise<ProgressLogWithItem[]>,
            this.commitmentLogRepository.findByDateRange(userId, firstDay, lastDay) as Promise<CommitmentLogWithCommitment[]>,
        ]);

        // Group logs by date
        const monthlyData: Record<string, any> = {};

        // Initialize all days of the month
        const daysInMonth = lastDay.getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const dateKey = dayDate.toISOString().split('T')[0];
            monthlyData[dateKey] = {
                progressLogs: [],
                commitmentLogs: [],
            };
        }

        // Group progress logs by date
        progressLogs.forEach((log) => {
            const dateKey = new Date(log.loggedAt).toISOString().split('T')[0];
            if (monthlyData[dateKey]) {
                monthlyData[dateKey].progressLogs.push(log);
            }
        });

        // Group commitment logs by date
        commitmentLogs.forEach((log) => {
            const dateKey = new Date(log.completedAt).toISOString().split('T')[0];
            if (monthlyData[dateKey]) {
                monthlyData[dateKey].commitmentLogs.push(log);
            }
        });

        // Calculate summary
        const totalProgressLogs = progressLogs.length;
        const totalCommitmentLogs = commitmentLogs.length;

        return {
            monthlyData,
            summary: {
                totalProgressLogs,
                totalCommitmentLogs,
            },
        };
    }

    /**
     * Get all active progress items and commitments (ignoring active/scheduled day filters)
     */
    async getAllActiveItems(userId: string, date?: string) {
        // Fetch all active progress items (no activeDay filter)
        const progressItemsResult = await this.progressItemRepository.findAll(userId, {
            skip: 0,
            take: 1000, // Large number to get all items
        });

        // Filter only active status items
        const activeProgressItems = progressItemsResult.items.filter((item: any) => item.status === 'active');

        // Fetch all commitments
        const commitments = await this.commitmentRepository.findByUserId(userId) ?? [];

        // Enrich progress items with last progress timestamp and active today flag
        const enrichedProgressItems = await Promise.all(
            activeProgressItems.map(async (item: any) => {
                // Get most recent log
                const logs = await this.progressLogRepository.findByItemId(item.id, { skip: 0, take: 1 });
                const lastProgressAt = logs.length > 0 ? logs[0].loggedAt : null;

                // Check if active today
                let isActiveToday = false;
                if (date) {
                    const dayOfWeek = this.getDayOfWeek(date);
                    const activeDays = item.activeDays as string[];
                    isActiveToday = activeDays.includes(dayOfWeek);
                }

                return {
                    ...item,
                    lastProgressAt,
                    isActiveToday,
                };
            })
        );

        // Enrich commitments with scheduled today flag
        const enrichedCommitments = commitments.map((commitment: any) => {
            let isScheduledToday = false;
            if (date) {
                const dayOfWeek = this.getDayOfWeek(date);
                const scheduledDays = commitment.scheduledDays as string[];
                isScheduledToday = scheduledDays.includes(dayOfWeek);
            }

            return {
                ...commitment,
                isScheduledToday,
            };
        });

        return {
            progressItems: enrichedProgressItems,
            commitments: enrichedCommitments,
        };
    }
}
