import { httpClient } from '@/shared/utils/http-client'
import type { ApiSuccessResponse } from '@/shared/types'
import type {
  AllItemsData,
  MonthlyHistoryData,
  TodayHistoryData,
  WeeklyHistoryData,
} from '../types/history.types'

export const historyApi = {
  async getToday(date: string): Promise<TodayHistoryData> {
    const response = await httpClient.get<ApiSuccessResponse<TodayHistoryData>>('/history/today', {
      params: { date },
    })
    return response.data.data
  },

  async getWeek(date: string): Promise<WeeklyHistoryData> {
    const response = await httpClient.get<ApiSuccessResponse<WeeklyHistoryData>>('/history/week', {
      params: { date },
    })
    return response.data.data
  },

  async getMonth(date: string): Promise<MonthlyHistoryData> {
    const response = await httpClient.get<ApiSuccessResponse<MonthlyHistoryData>>('/history/month', {
      params: { date },
    })
    return response.data.data
  },

  async getAllItems(date: string): Promise<AllItemsData> {
    const response = await httpClient.get<ApiSuccessResponse<AllItemsData>>('/items/all', {
      params: { date },
    })
    return response.data.data
  },
}
