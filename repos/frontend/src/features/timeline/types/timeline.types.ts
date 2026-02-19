export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type TimelineRecurrence = 'daily' | 'weekly' | null

export interface TimelineEvent {
  id: string
  userId: string
  title: string
  startTime: string
  durationMinutes: number
  recurrencePattern: TimelineRecurrence
  daysOfWeek: DayOfWeek[] | null
  status: 'active' | 'settled'
  createdAt: string
  updatedAt: string
}

export interface CreateTimelineEventDto {
  title: string
  startTime: string
  durationMinutes?: number
  recurrencePattern?: Exclude<TimelineRecurrence, null>
  daysOfWeek?: DayOfWeek[]
}

export interface UpdateTimelineEventDto {
  title?: string
  startTime?: string
  durationMinutes?: number
  recurrencePattern?: Exclude<TimelineRecurrence, null>
  daysOfWeek?: DayOfWeek[]
}
