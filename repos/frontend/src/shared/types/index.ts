// User Types
export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
  lastLogin: string | null
}

export interface UserPreferences {
  id: string
  userId: string
  defaultActiveDays: string[]
  theme: 'auto' | 'light' | 'dark'
  timezone: string
  enableNotifications: boolean
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

// Auth Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  token: string
}

// Error Types
export interface ApiError {
  code: string
  message: string
  details?: Array<{
    field: string
    message: string
  }>
}

// Domain Types
export interface ProgressItem {
  id: string
  userId: string
  title: string
  importance: 'high' | 'low'
  urgency: 'high' | 'low'
  deadline: string | null
  activeDays: string[]
  status: 'active' | 'settled'
  createdAt: string
  updatedAt: string
}

export interface Commitment {
  id: string
  userId: string
  title: string
  scheduledDays: string[]
  createdAt: string
  updatedAt: string
}

export interface TimelineEvent {
  id: string
  userId: string
  title: string
  startTime: string
  durationMinutes: number
  recurrencePattern: string | null
  daysOfWeek: string[] | null
  status: 'active'
  createdAt: string
  updatedAt: string
}

export interface DashboardData {
  date: string
  timelineEvents: TimelineEvent[]
  progressItems: ProgressItem[]
  commitments: Commitment[]
}
