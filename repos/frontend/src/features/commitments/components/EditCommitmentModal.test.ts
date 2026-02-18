import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EditCommitmentModal from './EditCommitmentModal.vue'
import type { Commitment } from '../types/commitment.types'

// Mock CreateCommitmentForm to avoid testing its internal logic again
vi.mock('./CreateCommitmentForm.vue', () => ({
    default: {
        name: 'CreateCommitmentForm',
        template: '<form @submit.prevent="$emit(\'success\', { title: \'Updated\', scheduledDays: [\'mon\'] })" @keydown.esc="$emit(\'cancel\')"></form>',
        props: ['initialValues', 'isEditing'],
        emits: ['success', 'cancel'],
    },
}))

const mockCommitment: Commitment = {
    id: 'com-1',
    userId: 'user-1',
    title: 'Original Title',
    scheduledDays: ['mon', 'wed', 'fri'],
    status: 'active',
    completedToday: false,
    createdAt: '2021-01-01',
    updatedAt: '2021-01-01',
}

describe('EditCommitmentModal', () => {
    function createWrapper(props: Partial<{ open: boolean; commitment: Commitment }> = {}) {
        return mount(EditCommitmentModal, {
            props: {
                open: true,
                commitment: mockCommitment,
                ...props,
            },
        })
    }

    // ============ POSITIVE TESTS ============

    it('renders when open is true', () => {
        const wrapper = createWrapper({ open: true })
        expect(wrapper.findComponent({ name: 'CreateCommitmentForm' }).exists()).toBe(true)
    })

    it('does not render when open is false', () => {
        const wrapper = createWrapper({ open: false })
        expect(wrapper.findComponent({ name: 'CreateCommitmentForm' }).exists()).toBe(false)
    })

    it('passes commitment data as initialValues to form', () => {
        const wrapper = createWrapper()
        const form = wrapper.findComponent({ name: 'CreateCommitmentForm' })

        const expectedValues = {
            title: 'Original Title',
            scheduledDays: ['mon', 'wed', 'fri'],
        }
        expect(form.props('initialValues')).toEqual(expectedValues)
    })

    it('passes isEditing=true to form', () => {
        const wrapper = createWrapper()
        const form = wrapper.findComponent({ name: 'CreateCommitmentForm' })
        expect(form.props('isEditing')).toBe(true)
    })

    it('emits save with id and dto when form succeeds', async () => {
        const wrapper = createWrapper()
        const form = wrapper.findComponent({ name: 'CreateCommitmentForm' })

        const dto = { title: 'New Title', scheduledDays: ['mon'] as const }
        form.vm.$emit('success', dto)

        expect(wrapper.emitted('save')).toBeTruthy()
        expect(wrapper.emitted('save')![0]).toEqual(['com-1', dto])
    })

    it('closes modal (emits update:open false) when form cancels', async () => {
        const wrapper = createWrapper()
        const form = wrapper.findComponent({ name: 'CreateCommitmentForm' })

        form.vm.$emit('cancel')
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('update:open')).toBeTruthy()
        expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    // ============ REACTIVITY TESTS ============

    it('updates initialValues when props.commitment changes', async () => {
        const wrapper = createWrapper()

        const newCommitment = { ...mockCommitment, title: 'Changed' }
        await wrapper.setProps({ commitment: newCommitment })

        const form = wrapper.findComponent({ name: 'CreateCommitmentForm' })
        expect(form.props('initialValues').title).toBe('Changed')
    })
})
