/**
 * Commitment Types
 */

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type CommitmentStatus = 'active' | 'settled'

export interface Commitment {
    id: string
    userId: string
    title: string
    scheduledDays: DayOfWeek[]
    status: CommitmentStatus
    completedToday: boolean
    createdAt: string
    updatedAt: string
}

export interface CreateCommitmentDto {
    title: string
    scheduledDays: DayOfWeek[]
}

export interface UpdateCommitmentDto {
    title?: string
    scheduledDays?: DayOfWeek[]
}

export interface CommitmentLog {
    id: string
    commitmentId: string
    completedAt: string
    note: string | null
}

export interface CreateCommitmentLogDto {
    note?: string
}

export interface CommitmentListResponse {
    data: Commitment[]
    message: string
    code: string
}
