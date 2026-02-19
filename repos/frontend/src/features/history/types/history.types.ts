export type HistoryTab = 'today' | 'week' | 'month' | 'all'

export interface ProgressLogEntry {
  id: string
  progressItemId: string
  loggedAt: string
  note: string | null
  isOffDay: boolean
  progressItem: {
    id: string
    title: string
    importance?: string
    urgency?: string
  }
}

export interface CommitmentLogEntry {
  id: string
  commitmentId: string
  completedAt: string
  note: string | null
  commitment: {
    id: string
    title: string
    scheduledDays?: string[]
  }
}

export interface TodayHistoryData {
  progressLogs: ProgressLogEntry[]
  commitmentLogs: CommitmentLogEntry[]
  summary: {
    progressLogCount: number
    commitmentLogCount: number
  }
}

export interface HistoryByDateItem {
  progressLogs: ProgressLogEntry[]
  commitmentLogs: CommitmentLogEntry[]
}

export interface WeeklyHistoryData {
  weeklyData: Record<string, HistoryByDateItem>
  summary: {
    totalProgressLogs: number
    totalCommitmentLogs: number
  }
}

export interface MonthlyHistoryData {
  monthlyData: Record<string, HistoryByDateItem>
  summary: {
    totalProgressLogs: number
    totalCommitmentLogs: number
  }
}

export interface AllItemsProgressItem {
  id: string
  title: string
  activeDays: string[]
  isActiveToday: boolean
  lastProgressAt: string | null
}

export interface AllItemsCommitment {
  id: string
  title: string
  scheduledDays: string[]
  isScheduledToday: boolean
}

export interface AllItemsData {
  progressItems: AllItemsProgressItem[]
  commitments: AllItemsCommitment[]
}
