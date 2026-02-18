import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCommitments } from './useCommitments'
import { commitmentsApi } from '../services/commitments.api'
import type { Commitment, CreateCommitmentDto } from '../types/commitment.types'

vi.mock('../services/commitments.api', () => ({
    commitmentsApi: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}))

const mockCommitments: Commitment[] = [
    {
        id: 'com-1',
        userId: 'user-1',
        title: 'Exercise',
        scheduledDays: ['mon', 'wed', 'fri'],
        status: 'active',
        completedToday: false,
        createdAt: '2026-02-17T10:00:00Z',
        updatedAt: '2026-02-17T10:00:00Z',
    },
    {
        id: 'com-2',
        userId: 'user-1',
        title: 'Read',
        scheduledDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        status: 'active',
        completedToday: true,
        createdAt: '2026-02-15T08:00:00Z',
        updatedAt: '2026-02-15T08:00:00Z',
    },
]

describe('useCommitments', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ============ INITIAL STATE ============

    it('initializes with correct default state', () => {
        const { commitments, loading, error } = useCommitments()

        expect(commitments.value).toEqual([])
        expect(loading.value).toBe(false)
        expect(error.value).toBeNull()
    })

    // ============ FETCH COMMITMENTS (POSITIVE) ============

    describe('fetchCommitments', () => {
        it('sets loading state during fetch', async () => {
            const mockGetAll = vi.mocked(commitmentsApi.getAll)
            let resolvePromise: (value: Commitment[]) => void
            mockGetAll.mockReturnValue(
                new Promise((resolve) => {
                    resolvePromise = resolve
                })
            )

            const { fetchCommitments, loading } = useCommitments()

            const fetchPromise = fetchCommitments()
            expect(loading.value).toBe(true)

            resolvePromise!(mockCommitments)
            await fetchPromise
            expect(loading.value).toBe(false)
        })

        it('stores fetched commitments', async () => {
            vi.mocked(commitmentsApi.getAll).mockResolvedValue(mockCommitments)

            const { fetchCommitments, commitments } = useCommitments()
            await fetchCommitments()

            expect(commitments.value).toEqual(mockCommitments)
            expect(commitments.value).toHaveLength(2)
        })

        it('returns empty list when user has no commitments', async () => {
            vi.mocked(commitmentsApi.getAll).mockResolvedValue([])

            const { fetchCommitments, commitments } = useCommitments()
            await fetchCommitments()

            expect(commitments.value).toEqual([])
        })

        // NEGATIVE: fetch error
        it('sets error on API failure and throws', async () => {
            vi.mocked(commitmentsApi.getAll).mockRejectedValue({
                response: { data: { message: 'Server error' } },
            })

            const { fetchCommitments, error, commitments, loading } = useCommitments()

            await expect(fetchCommitments()).rejects.toBeTruthy()

            expect(error.value).toBe('Server error')
            expect(commitments.value).toEqual([])
            expect(loading.value).toBe(false)
        })

        it('uses fallback error message when response has no message', async () => {
            vi.mocked(commitmentsApi.getAll).mockRejectedValue(new Error('Network fail'))

            const { fetchCommitments, error } = useCommitments()
            await expect(fetchCommitments()).rejects.toBeTruthy()

            expect(error.value).toBe('Failed to fetch commitments')
        })
    })

    // ============ CREATE COMMITMENT (POSITIVE) ============

    describe('createCommitment', () => {
        it('creates commitment and adds to list', async () => {
            const newCommitment: Commitment = {
                id: 'com-3',
                userId: 'user-1',
                title: 'Meditate',
                scheduledDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
                status: 'active',
                completedToday: false,
                createdAt: '2026-02-18T10:00:00Z',
                updatedAt: '2026-02-18T10:00:00Z',
            }

            vi.mocked(commitmentsApi.create).mockResolvedValue(newCommitment)

            const { createCommitment, commitments } = useCommitments()
            const dto: CreateCommitmentDto = { title: 'Meditate', scheduledDays: ['mon', 'tue', 'wed', 'thu', 'fri'] }
            const result = await createCommitment(dto)

            expect(commitmentsApi.create).toHaveBeenCalledWith(dto)
            expect(result).toEqual(newCommitment)
            expect(commitments.value).toHaveLength(1)
            expect(commitments.value[0].title).toBe('Meditate')
        })

        it('prepends newly created commitment to the list', async () => {
            vi.mocked(commitmentsApi.getAll).mockResolvedValue([...mockCommitments])

            const newCommitment: Commitment = {
                ...mockCommitments[0],
                id: 'com-new',
                title: 'New routine',
            }
            vi.mocked(commitmentsApi.create).mockResolvedValue(newCommitment)

            const { fetchCommitments, createCommitment, commitments } = useCommitments()
            await fetchCommitments()
            expect(commitments.value).toHaveLength(2)

            await createCommitment({ title: 'New routine', scheduledDays: ['mon'] })
            expect(commitments.value).toHaveLength(3)
            expect(commitments.value[0].title).toBe('New routine')
        })

        // NEGATIVE: create fails
        it('sets error when creation fails and throws', async () => {
            vi.mocked(commitmentsApi.create).mockRejectedValue({
                response: { data: { message: 'Invalid scheduled days' } },
            })

            const { createCommitment, error, commitments } = useCommitments()

            await expect(
                createCommitment({ title: 'Test', scheduledDays: [] as any })
            ).rejects.toBeTruthy()

            expect(error.value).toBe('Invalid scheduled days')
            expect(commitments.value).toHaveLength(0)
        })
    })

    // ============ UPDATE COMMITMENT (POSITIVE) ============

    describe('updateCommitment', () => {
        it('updates commitment via API and updates local list', async () => {
            vi.mocked(commitmentsApi.getAll).mockResolvedValue([...mockCommitments])
            const updatedCommitment = { ...mockCommitments[0], title: 'Updated Title' }
            vi.mocked(commitmentsApi.update).mockResolvedValue(updatedCommitment)

            const { fetchCommitments, updateCommitment, commitments } = useCommitments()
            await fetchCommitments()

            const dto = { title: 'Updated Title' }
            const result = await updateCommitment('com-1', dto as any)

            expect(commitmentsApi.update).toHaveBeenCalledWith('com-1', dto)
            expect(result).toEqual(updatedCommitment)
            expect(commitments.value.find(c => c.id === 'com-1')?.title).toBe('Updated Title')
        })

        // NEGATIVE: update fails
        it('sets error when update fails and throws', async () => {
            vi.mocked(commitmentsApi.update).mockRejectedValue({
                response: { data: { message: 'Update failed' } },
            })

            const { updateCommitment, error } = useCommitments()

            await expect(updateCommitment('com-1', {} as any)).rejects.toBeTruthy()
            expect(error.value).toBe('Update failed')
        })
    })

    // ============ DELETE COMMITMENT (POSITIVE) ============

    describe('deleteCommitment', () => {
        it('deletes commitment and removes from list', async () => {
            vi.mocked(commitmentsApi.getAll).mockResolvedValue([...mockCommitments])
            vi.mocked(commitmentsApi.delete).mockResolvedValue(undefined)

            const { fetchCommitments, deleteCommitment, commitments } = useCommitments()
            await fetchCommitments()
            expect(commitments.value).toHaveLength(2)

            await deleteCommitment('com-1')

            expect(commitmentsApi.delete).toHaveBeenCalledWith('com-1')
            expect(commitments.value).toHaveLength(1)
            expect(commitments.value[0].id).toBe('com-2')
        })

        // NEGATIVE: delete fails
        it('sets error when deletion fails and throws', async () => {
            vi.mocked(commitmentsApi.getAll).mockResolvedValue([...mockCommitments])
            vi.mocked(commitmentsApi.delete).mockRejectedValue({
                response: { data: { message: 'Commitment not found' } },
            })

            const { fetchCommitments, deleteCommitment, error, commitments } = useCommitments()
            await fetchCommitments()

            await expect(deleteCommitment('nonexistent')).rejects.toBeTruthy()

            expect(error.value).toBe('Commitment not found')
            // List should remain unchanged on failure
            expect(commitments.value).toHaveLength(2)
        })
    })

    // ============ LOADING STATE ============

    describe('loading state', () => {
        it('resets loading to false after successful fetch', async () => {
            vi.mocked(commitmentsApi.getAll).mockResolvedValue([])

            const { fetchCommitments, loading } = useCommitments()
            await fetchCommitments()

            expect(loading.value).toBe(false)
        })

        it('resets loading to false after failed fetch', async () => {
            vi.mocked(commitmentsApi.getAll).mockRejectedValue(new Error('fail'))

            const { fetchCommitments, loading } = useCommitments()
            await fetchCommitments().catch(() => { })

            expect(loading.value).toBe(false)
        })
    })
})
