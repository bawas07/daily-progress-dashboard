import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCommitmentLogs } from './useCommitmentLogs'
import { commitmentsApi } from '../services/commitments.api'
import type { CommitmentLog } from '../types/commitment.types'

vi.mock('../services/commitments.api', () => ({
    commitmentsApi: {
        getLogs: vi.fn(),
        logActivity: vi.fn(),
    },
}))

const mockLogs: CommitmentLog[] = [
    {
        id: 'log-1',
        commitmentId: 'com-1',
        completedAt: '2026-02-18T08:00:00Z',
        note: 'Completed morning run',
    },
    {
        id: 'log-2',
        commitmentId: 'com-1',
        completedAt: '2026-02-17T08:30:00Z',
        note: null,
    },
]

describe('useCommitmentLogs', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============ INITIAL STATE ============

    it('initializes with empty state', () => {
        const { logs, loading, error } = useCommitmentLogs()

        expect(logs.value).toEqual([])
        expect(loading.value).toBe(false)
        expect(error.value).toBeNull()
    })

    // ============ FETCH LOGS (POSITIVE) ============

    describe('fetchLogs', () => {
        it('fetches and stores logs for a commitment', async () => {
            vi.mocked(commitmentsApi.getLogs).mockResolvedValue(mockLogs)

            const { fetchLogs, logs } = useCommitmentLogs()
            await fetchLogs('com-1')

            expect(commitmentsApi.getLogs).toHaveBeenCalledWith('com-1')
            expect(logs.value).toEqual(mockLogs)
            expect(logs.value).toHaveLength(2)
        })

        it('returns empty list when no logs exist', async () => {
            vi.mocked(commitmentsApi.getLogs).mockResolvedValue([])

            const { fetchLogs, logs } = useCommitmentLogs()
            await fetchLogs('com-1')

            expect(logs.value).toEqual([])
        })

        it('sets loading during fetch', async () => {
            let resolvePromise: (value: CommitmentLog[]) => void
            vi.mocked(commitmentsApi.getLogs).mockReturnValue(
                new Promise((resolve) => {
                    resolvePromise = resolve
                })
            )

            const { fetchLogs, loading } = useCommitmentLogs()

            const promise = fetchLogs('com-1')
            expect(loading.value).toBe(true)

            resolvePromise!([])
            await promise
            expect(loading.value).toBe(false)
        })

        // NEGATIVE: fetch logs fails
        it('sets error when fetch fails and throws', async () => {
            vi.mocked(commitmentsApi.getLogs).mockRejectedValue({
                response: { data: { message: 'Commitment not found' } },
            })

            const { fetchLogs, error, logs } = useCommitmentLogs()
            await expect(fetchLogs('nonexistent')).rejects.toBeTruthy()

            expect(error.value).toBe('Commitment not found')
            expect(logs.value).toEqual([])
        })

        it('uses fallback error message when none provided', async () => {
            vi.mocked(commitmentsApi.getLogs).mockRejectedValue(new Error('Network'))

            const { fetchLogs, error } = useCommitmentLogs()
            await expect(fetchLogs('com-1')).rejects.toBeTruthy()

            expect(error.value).toBe('Failed to fetch commitment logs')
        })
    })

    // ============ LOG ACTIVITY (POSITIVE) ============

    describe('logActivity', () => {
        it('logs activity with note and prepends to list', async () => {
            const newLog: CommitmentLog = {
                id: 'log-3',
                commitmentId: 'com-1',
                completedAt: '2026-02-18T10:00:00Z',
                note: 'Done again!',
            }
            vi.mocked(commitmentsApi.logActivity).mockResolvedValue(newLog)

            const { logActivity, logs } = useCommitmentLogs()
            const result = await logActivity('com-1', { note: 'Done again!' })

            expect(commitmentsApi.logActivity).toHaveBeenCalledWith('com-1', { note: 'Done again!' })
            expect(result).toEqual(newLog)
            expect(logs.value[0]).toEqual(newLog)
        })

        it('logs activity without note', async () => {
            const newLog: CommitmentLog = {
                id: 'log-4',
                commitmentId: 'com-1',
                completedAt: '2026-02-18T10:00:00Z',
                note: null,
            }
            vi.mocked(commitmentsApi.logActivity).mockResolvedValue(newLog)

            const { logActivity, logs } = useCommitmentLogs()
            await logActivity('com-1', {})

            expect(commitmentsApi.logActivity).toHaveBeenCalledWith('com-1', {})
            expect(logs.value[0].note).toBeNull()
        })

        it('allows multiple logs per day (prepends each)', async () => {
            const log1: CommitmentLog = {
                id: 'log-a',
                commitmentId: 'com-1',
                completedAt: '2026-02-18T08:00:00Z',
                note: 'Morning',
            }
            const log2: CommitmentLog = {
                id: 'log-b',
                commitmentId: 'com-1',
                completedAt: '2026-02-18T20:00:00Z',
                note: 'Evening',
            }

            vi.mocked(commitmentsApi.logActivity)
                .mockResolvedValueOnce(log1)
                .mockResolvedValueOnce(log2)

            const { logActivity, logs } = useCommitmentLogs()

            await logActivity('com-1', { note: 'Morning' })
            expect(logs.value).toHaveLength(1)

            await logActivity('com-1', { note: 'Evening' })
            expect(logs.value).toHaveLength(2)
            expect(logs.value[0].note).toBe('Evening')
            expect(logs.value[1].note).toBe('Morning')
        })

        // NEGATIVE: log activity fails
        it('sets error when logging fails and throws', async () => {
            vi.mocked(commitmentsApi.logActivity).mockRejectedValue({
                response: { data: { message: 'Commitment not found' } },
            })

            const { logActivity, error, logs } = useCommitmentLogs()
            await expect(logActivity('nonexistent', { note: 'test' })).rejects.toBeTruthy()

            expect(error.value).toBe('Commitment not found')
            expect(logs.value).toEqual([])
        })
    })

    // ============ LOADING STATE ============

    describe('loading state', () => {
        it('resets loading after successful log', async () => {
            vi.mocked(commitmentsApi.logActivity).mockResolvedValue(mockLogs[0])

            const { logActivity, loading } = useCommitmentLogs()
            await logActivity('com-1', {})

            expect(loading.value).toBe(false)
        })

        it('resets loading after failed log', async () => {
            vi.mocked(commitmentsApi.logActivity).mockRejectedValue(new Error('fail'))

            const { logActivity, loading } = useCommitmentLogs()
            await logActivity('com-1', {}).catch(() => { })

            expect(loading.value).toBe(false)
        })
    })
})
