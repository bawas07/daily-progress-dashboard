import { describe, it, expect, vi, beforeEach } from 'vitest'
import { commitmentsApi } from './commitments.api'
import { apiClient } from '@/shared/api'

vi.mock('@/shared/api', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}))

const mockCommitment = {
    id: 'com-1',
    userId: 'user-1',
    title: 'Exercise',
    scheduledDays: ['mon', 'wed', 'fri'],
    status: 'active',
    completedToday: false,
    createdAt: '2026-02-17T10:00:00Z',
    updatedAt: '2026-02-17T10:00:00Z',
}

const mockLog = {
    id: 'log-1',
    commitmentId: 'com-1',
    completedAt: '2026-02-18T08:00:00Z',
    note: 'Done!',
}

describe('commitmentsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============ POSITIVE TESTS ============

    describe('getAll', () => {
        it('calls GET /commitments and returns commitment list', async () => {
            const mockGet = vi.mocked(apiClient.get)
            mockGet.mockResolvedValue({
                data: {
                    data: [mockCommitment],
                    message: 'Commitments retrieved',
                    code: 'S001',
                },
            })

            const result = await commitmentsApi.getAll()

            expect(mockGet).toHaveBeenCalledWith('/commitments')
            expect(result).toEqual([mockCommitment])
        })

        it('returns empty array when no commitments exist', async () => {
            const mockGet = vi.mocked(apiClient.get)
            mockGet.mockResolvedValue({
                data: { data: [], message: 'Commitments retrieved', code: 'S001' },
            })

            const result = await commitmentsApi.getAll()

            expect(result).toEqual([])
        })
    })

    describe('create', () => {
        it('calls POST /commitments with dto and returns created commitment', async () => {
            const mockPost = vi.mocked(apiClient.post)
            mockPost.mockResolvedValue({
                data: {
                    data: mockCommitment,
                    message: 'Commitment created',
                    code: 'S002',
                },
            })

            const dto = { title: 'Exercise', scheduledDays: ['mon', 'wed', 'fri'] as ('mon' | 'wed' | 'fri')[] }
            const result = await commitmentsApi.create(dto)

            expect(mockPost).toHaveBeenCalledWith('/commitments', dto)
            expect(result).toEqual(mockCommitment)
        })
    })

    describe('delete', () => {
        it('calls DELETE /commitments/:id', async () => {
            const mockDelete = vi.mocked(apiClient.delete)
            mockDelete.mockResolvedValue({ data: {} })

            await commitmentsApi.delete('com-1')

            expect(mockDelete).toHaveBeenCalledWith('/commitments/com-1')
        })
    })

    describe('logActivity', () => {
        it('calls POST /commitments/:id/logs and returns log entry', async () => {
            const mockPost = vi.mocked(apiClient.post)
            mockPost.mockResolvedValue({
                data: {
                    data: mockLog,
                    message: 'Commitment logged',
                    code: 'S003',
                },
            })

            const dto = { note: 'Done!' }
            const result = await commitmentsApi.logActivity('com-1', dto)

            expect(mockPost).toHaveBeenCalledWith('/commitments/com-1/logs', dto)
            expect(result).toEqual(mockLog)
        })

        it('logs activity without note', async () => {
            const mockPost = vi.mocked(apiClient.post)
            const logWithoutNote = { ...mockLog, note: null }
            mockPost.mockResolvedValue({
                data: { data: logWithoutNote, message: 'Commitment logged', code: 'S003' },
            })

            const dto = {}
            const result = await commitmentsApi.logActivity('com-1', dto)

            expect(result.note).toBeNull()
        })
    })

    // ============ NEGATIVE TESTS ============

    describe('error handling', () => {
        it('propagates network error from getAll', async () => {
            const mockGet = vi.mocked(apiClient.get)
            mockGet.mockRejectedValue(new Error('Network error'))

            await expect(commitmentsApi.getAll()).rejects.toThrow('Network error')
        })

        it('propagates validation error from create', async () => {
            const mockPost = vi.mocked(apiClient.post)
            const axiosError = {
                response: { status: 400, data: { message: 'Invalid scheduled days', code: 'E001' } },
            }
            mockPost.mockRejectedValue(axiosError)

            await expect(
                commitmentsApi.create({ title: 'Test', scheduledDays: [] as any })
            ).rejects.toEqual(axiosError)
        })

        it('propagates 404 error from delete', async () => {
            const mockDelete = vi.mocked(apiClient.delete)
            const axiosError = {
                response: { status: 404, data: { message: 'Commitment not found', code: 'E004' } },
            }
            mockDelete.mockRejectedValue(axiosError)

            await expect(commitmentsApi.delete('nonexistent')).rejects.toEqual(axiosError)
        })

        it('propagates 404 error from logActivity', async () => {
            const mockPost = vi.mocked(apiClient.post)
            const axiosError = {
                response: { status: 404, data: { message: 'Commitment not found', code: 'E004' } },
            }
            mockPost.mockRejectedValue(axiosError)

            await expect(commitmentsApi.logActivity('nonexistent', {})).rejects.toEqual(axiosError)
        })
    })
})
