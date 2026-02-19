import { httpClient } from '@/shared/utils/http-client'
import type { ApiSuccessResponse } from '@/shared/types'
import type {
  TimelineEvent,
  CreateTimelineEventDto,
  UpdateTimelineEventDto,
} from '../types/timeline.types'

const API_BASE = '/timeline-events'

export const timelineApi = {
  async getEvents(date: string): Promise<TimelineEvent[]> {
    const response = await httpClient.get<ApiSuccessResponse<TimelineEvent[]>>(API_BASE, {
      params: { date },
    })
    return response.data.data
  },

  async getById(id: string): Promise<TimelineEvent> {
    const response = await httpClient.get<ApiSuccessResponse<TimelineEvent>>(`${API_BASE}/${id}`)
    return response.data.data
  },

  async create(data: CreateTimelineEventDto): Promise<TimelineEvent> {
    const response = await httpClient.post<ApiSuccessResponse<TimelineEvent>>(API_BASE, data)
    return response.data.data
  },

  async update(id: string, data: UpdateTimelineEventDto): Promise<TimelineEvent> {
    const response = await httpClient.put<ApiSuccessResponse<TimelineEvent>>(`${API_BASE}/${id}`, data)
    return response.data.data
  },

  async delete(id: string): Promise<void> {
    await httpClient.delete(`${API_BASE}/${id}`)
  },
}
