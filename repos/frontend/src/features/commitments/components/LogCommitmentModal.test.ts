import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LogCommitmentModal from './LogCommitmentModal.vue'

describe('LogCommitmentModal', () => {
    function createWrapper(props: Partial<{ open: boolean; commitmentTitle: string; submitting: boolean }> = {}) {
        return mount(LogCommitmentModal, {
            props: {
                open: true,
                commitmentTitle: 'Exercise',
                submitting: false,
                ...props,
            },
        })
    }

    // ============ POSITIVE TESTS ============

    it('renders when open prop is true', () => {
        const wrapper = createWrapper({ open: true })
        expect(wrapper.text()).toContain('Log Activity: Exercise')
    })

    it('does not render when open prop is false', () => {
        const wrapper = createWrapper({ open: false })
        expect(wrapper.text()).not.toContain('Log Activity')
    })

    it('displays commitment title in header', () => {
        const wrapper = createWrapper({ commitmentTitle: 'Morning Run' })
        expect(wrapper.text()).toContain('Log Activity: Morning Run')
    })

    it('emits submit with note when form is submitted', async () => {
        const wrapper = createWrapper()

        const textarea = wrapper.find('textarea')
        await textarea.setValue('Completed 30 mins')

        await wrapper.find('form').trigger('submit.prevent')

        expect(wrapper.emitted('submit')).toBeTruthy()
        const dto = wrapper.emitted('submit')![0][0] as any
        expect(dto.note).toBe('Completed 30 mins')
    })

    it('emits submit without note (undefined) when textarea is empty', async () => {
        const wrapper = createWrapper()

        await wrapper.find('form').trigger('submit.prevent')

        expect(wrapper.emitted('submit')).toBeTruthy()
        const dto = wrapper.emitted('submit')![0][0] as any
        expect(dto.note).toBeUndefined()
    })

    it('emits update:open false when close button is clicked', async () => {
        const wrapper = createWrapper()

        // Find close button (✕)
        const closeBtn = wrapper.findAll('button').find((b) => b.text().includes('✕'))
        await closeBtn!.trigger('click')

        expect(wrapper.emitted('update:open')).toBeTruthy()
        expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    it('emits update:open false when cancel button is clicked', async () => {
        const wrapper = createWrapper()

        const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
        await cancelBtn!.trigger('click')

        expect(wrapper.emitted('update:open')).toBeTruthy()
        expect(wrapper.emitted('update:open')![0]).toEqual([false])
    })

    it('shows character counter', () => {
        const wrapper = createWrapper()
        expect(wrapper.text()).toContain('1000 characters remaining')
    })

    it('updates character counter as user types', async () => {
        const wrapper = createWrapper()

        const textarea = wrapper.find('textarea')
        await textarea.setValue('Hello')

        expect(wrapper.text()).toContain('995 characters remaining')
    })

    // ============ NEGATIVE TESTS ============

    it('disables buttons when submitting', () => {
        const wrapper = createWrapper({ submitting: true })

        const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
        expect(cancelBtn!.attributes('disabled')).toBeDefined()

        const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Logging'))
        expect(submitBtn!.attributes('disabled')).toBeDefined()
    })

    it('shows Logging... text when submitting', () => {
        const wrapper = createWrapper({ submitting: true })
        expect(wrapper.text()).toContain('Logging...')
    })

    it('shows Log Activity text when not submitting', () => {
        const wrapper = createWrapper({ submitting: false })
        expect(wrapper.text()).toContain('Log Activity')
    })

    it('trims whitespace-only note to undefined on submit', async () => {
        const wrapper = createWrapper()

        const textarea = wrapper.find('textarea')
        await textarea.setValue('   ')

        await wrapper.find('form').trigger('submit.prevent')

        const dto = wrapper.emitted('submit')![0][0] as any
        expect(dto.note).toBeUndefined()
    })

    it('resets note when modal is reopened', async () => {
        const wrapper = createWrapper({ open: true })

        const textarea = wrapper.find('textarea')
        await textarea.setValue('Some note')

        // Simulate closing and reopening
        await wrapper.setProps({ open: false })
        await wrapper.setProps({ open: true })

        // Note should be reset
        expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('')
    })
})
