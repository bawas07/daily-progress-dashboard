export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
    REVOKE: '/auth/revoke',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  USER: {
    PREFERENCES: '/user/preferences',
    UPDATE_PREFERENCES: '/user/preferences',
  },
  PROGRESS_ITEMS: '/progress-items',
  PROGRESS_ITEM_BY_ID: (id: string) => `/progress-items/${id}`,
  PROGRESS_ITEM_LOGS: (id: string) => `/progress-items/${id}/logs`,
  LOG_PROGRESS: (id: string) => `/progress-items/${id}/logs`,
  SETTLE_PROGRESS_ITEM: (id: string) => `/progress-items/${id}/settle`,
  COMMITMENTS: '/commitments',
  COMMITMENT_BY_ID: (id: string) => `/commitments/${id}`,
  COMMITMENT_LOGS: (id: string) => `/commitments/${id}/logs`,
  LOG_COMMITMENT: (id: string) => `/commitments/${id}/logs`,
  TIMELINE_EVENTS: '/timeline-events',
  TIMELINE_EVENT_BY_ID: (id: string) => `/timeline-events/${id}`,
  DASHBOARD: '/dashboard',
  HISTORY: {
    TODAY: '/history/today',
    WEEK: '/history/week',
    MONTH: '/history/month',
    ALL_ITEMS: '/items/all',
  },
  SYNC: '/sync',
} as const

export type EndpointKey = keyof typeof API_ENDPOINTS
