/**
 * Progress Item Types
 */

export type Importance = 'high' | 'low'
export type Urgency = 'high' | 'low'
export type ItemStatus = 'active' | 'settled'
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface ProgressItem {
  id: string
  userId: string
  title: string
  importance: Importance
  urgency: Urgency
  activeDays: DayOfWeek[]
  deadline: string | null
  status: ItemStatus
  createdAt: string
  updatedAt: string
}

export interface CreateProgressItemDto {
  title: string
  importance: Importance
  urgency: Urgency
  activeDays: DayOfWeek[]
  deadline?: string
}

export interface UpdateProgressItemDto {
  title?: string
  importance?: Importance
  urgency?: Urgency
  activeDays?: DayOfWeek[]
  deadline?: string | null
}

export interface ProgressLog {
  id: string
  itemId: string
  userId: string
  loggedAt: string
  note: string | null
  isOffDay: boolean
}

export interface CreateProgressLogDto {
  note?: string
  isOffDay?: boolean
}

export interface ProgressItemListResponse {
  data: {
    data: ProgressItem[]
    pagination: {
      total: number
      perPage: number
      currentPage: number
      lastPage: number
    }
  }
  message: string
  code: string
}
