/**
 * Dashboard-specific types matching the backend API response structure
 */

export interface DashboardTimelineEvent {
    id: string
    title: string
    startTime: string
    endTime: string
    durationMinutes: number
    description?: string | null
    recurrencePattern?: string | null
}

export interface DashboardProgressItem {
    id: string
    title: string
    importance: 'high' | 'low'
    urgency: 'high' | 'low'
    activeDays: string[]
    deadline: string | null
    status: string
}

export interface DashboardCommitment {
    id: string
    title: string
    scheduledDays: string[]
    completedToday: boolean
    completionCount: number
}

export interface DashboardProgressQuadrants {
    important: {
        urgent: DashboardProgressItem[]
        notUrgent: DashboardProgressItem[]
    }
    notImportant: {
        urgent: DashboardProgressItem[]
        notUrgent: DashboardProgressItem[]
    }
}

export interface DashboardData {
    timeline: {
        events: DashboardTimelineEvent[]
    }
    progressItems: DashboardProgressQuadrants
    commitments: DashboardCommitment[]
}
