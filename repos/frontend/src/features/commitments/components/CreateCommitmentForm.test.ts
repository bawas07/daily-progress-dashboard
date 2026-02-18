import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CreateCommitmentForm from './CreateCommitmentForm.vue'

// Mock the UI components to avoid complex dependency issues
vi.mock('@/components/ui', () => ({
    Button: {
        name: 'Button',
        template: '<button :disabled="disabled" :type="type"><slot /></button>',
        props: ['variant', 'disabled', 'type'],
    },
    Input: {
        name: 'Input',
        template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :id="id" :type="type" :placeholder="placeholder" />',
        props: ['modelValue', 'id', 'type', 'placeholder', 'error'],
        emits: ['update:modelValue'],
    },
    Card: {
        name: 'Card',
        template: '<div><slot /></div>',
        props: ['variant', 'padding'],
    },
    FormField: {
        name: 'FormField',
        template: '<div><slot :id="\'field-id\'" /></div>',
        props: ['label', 'required', 'help'],
    },
}))

describe('CreateCommitmentForm', () => {
    function createWrapper() {
        return mount(CreateCommitmentForm, {
            global: {
                stubs: {},
            },
        })
    }

    // ============ POSITIVE TESTS ============

    it('renders the form with title and scheduled days', () => {
        const wrapper = createWrapper()
        expect(wrapper.text()).toContain('Create Commitment')
        expect(wrapper.find('form').exists()).toBe(true)
    })

    it('renders day selection buttons for all 7 days', () => {
        const wrapper = createWrapper()
        const dayButtons = wrapper.findAll('button').filter((b) => {
            const text = b.text()
            return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(text)
        })
        expect(dayButtons).toHaveLength(7)
    })

    it('renders preset buttons (Weekdays, Daily, 3x/week)', () => {
        const wrapper = createWrapper()
        expect(wrapper.text()).toContain('Weekdays')
        expect(wrapper.text()).toContain('Daily')
        expect(wrapper.text()).toContain('3x/week')
    })

    it('defaults to weekday selection (Mon-Fri)', () => {
        const wrapper = createWrapper()
        // The weekday buttons should have the selected class
        const dayButtons = wrapper.findAll('button').filter((b) => {
            return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(b.text())
        })
        dayButtons.forEach((btn) => {
            expect(btn.classes().join(' ')).toContain('bg-primary-600')
        })
    })

    it('emits success event with correct dto on valid submit', async () => {
        const wrapper = createWrapper()

        // Set title
        const input = wrapper.find('input')
        await input.setValue('Exercise daily')

        // Submit form
        await wrapper.find('form').trigger('submit.prevent')

        expect(wrapper.emitted('success')).toBeTruthy()
        const emittedDto = wrapper.emitted('success')![0][0] as any
        expect(emittedDto.title).toBe('Exercise daily')
        expect(emittedDto.scheduledDays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri'])
    })

    it('emits cancel event when cancel button is clicked', async () => {
        const wrapper = createWrapper()

        // Find cancel button
        const cancelBtn = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
        expect(cancelBtn).toBeDefined()
        await cancelBtn!.trigger('click')

        expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('toggles day selection when clicking a day button', async () => {
        const wrapper = createWrapper()

        // Find Saturday button (not selected by default)
        const satBtn = wrapper.findAll('button').find((b) => b.text() === 'Sat')
        expect(satBtn).toBeDefined()

        // Click to select Sat
        await satBtn!.trigger('click')

        // Now Sat should be selected (has primary class)
        expect(satBtn!.classes().join(' ')).toContain('bg-primary-600')
    })

    // ============ NEGATIVE TESTS ============

    it('shows validation error when title is empty on submit', async () => {
        const wrapper = createWrapper()

        // Don't set title, just submit
        await wrapper.find('form').trigger('submit.prevent')

        expect(wrapper.text()).toContain('Title is required')
        expect(wrapper.emitted('success')).toBeFalsy()
    })

    it('does not emit success when title is only whitespace', async () => {
        const wrapper = createWrapper()

        const input = wrapper.find('input')
        await input.setValue('   ')

        await wrapper.find('form').trigger('submit.prevent')

        expect(wrapper.emitted('success')).toBeFalsy()
    })

    it('prevents deselecting all days (keeps at least one)', async () => {
        const wrapper = createWrapper()

        // Apply 3x/week preset first (only 3 days)
        const presetBtn = wrapper.findAll('button').find((b) => b.text() === '3x/week')
        await presetBtn!.trigger('click')

        // Try to deselect Mon (should work, 2 left)
        const monBtn = wrapper.findAll('button').find((b) => b.text() === 'Mon')
        await monBtn!.trigger('click')

        // Try to deselect Wed (should work, 1 left)
        const wedBtn = wrapper.findAll('button').find((b) => b.text() === 'Wed')
        await wedBtn!.trigger('click')

        // Try to deselect Fri (should NOT work, would leave 0)
        const friBtn = wrapper.findAll('button').find((b) => b.text() === 'Fri')
        await friBtn!.trigger('click')

        // Fri should still be selected
        expect(friBtn!.classes().join(' ')).toContain('bg-primary-600')
    })

    it('disables submit button when form is invalid', () => {
        const wrapper = createWrapper()

        // Without a title, submit should be disabled
        const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Create Commitment'))
        expect(submitBtn!.attributes('disabled')).toBeDefined()
    })

    // ============ PRESET TESTS ============

    it('applies Daily preset (all 7 days)', async () => {
        const wrapper = createWrapper()

        const dailyBtn = wrapper.findAll('button').find((b) => b.text() === 'Daily')
        await dailyBtn!.trigger('click')

        // Set title and submit
        const input = wrapper.find('input')
        await input.setValue('Daily thing')
        await wrapper.find('form').trigger('submit.prevent')

        const dto = wrapper.emitted('success')![0][0] as any
        expect(dto.scheduledDays).toHaveLength(7)
        expect(dto.scheduledDays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
    })

    it('applies 3x/week preset (Mon, Wed, Fri)', async () => {
        const wrapper = createWrapper()

        const btn = wrapper.findAll('button').find((b) => b.text() === '3x/week')
        await btn!.trigger('click')

        const input = wrapper.find('input')
        await input.setValue('Exercise')
        await wrapper.find('form').trigger('submit.prevent')

        const dto = wrapper.emitted('success')![0][0] as any
        expect(dto.scheduledDays).toEqual(['mon', 'wed', 'fri'])
    })

    // ============ EDIT MODE TESTS ============

    it('initializes form with values from initialValues prop', () => {
        const wrapper = mount(CreateCommitmentForm, {
            props: {
                initialValues: {
                    title: 'Existing Routine',
                    scheduledDays: ['sat', 'sun'],
                },
            },
            global: {
                stubs: { // Same stubs as above
                    Button: { template: '<button><slot /></button>', props: ['variant', 'disabled'] },
                    Input: { template: '<input :value="modelValue" />', props: ['modelValue', 'error'] },
                    Card: { template: '<div><slot /></div>', props: ['variant', 'padding'] },
                    FormField: { template: '<div><slot :id="\'field-id\'" /></div>', props: ['label'] },
                }
            }
        })

        // Check input is populated
        const input = wrapper.find('input')
        // We check props because our stub uses :value="modelValue"
        expect(input.attributes('value')).toBe('Existing Routine')

        // Check correct days are selected (Sat, Sun) by checking class
        const satBtn = wrapper.findAll('button').find(b => b.text() === 'Sat')
        expect(satBtn!.classes().join(' ')).toContain('bg-primary-600')

        const sunBtn = wrapper.findAll('button').find(b => b.text() === 'Sun')
        expect(sunBtn!.classes().join(' ')).toContain('bg-primary-600')

        // Mon should NOT be selected
        const monBtn = wrapper.findAll('button').find(b => b.text() === 'Mon')
        expect(monBtn!.classes().join(' ')).not.toContain('bg-primary-600')
    })

    it('displays "Edit Commitment" and "Save Changes" when isEditing is true', () => {
        const wrapper = mount(CreateCommitmentForm, {
            props: {
                isEditing: true,
            },
            global: {
                stubs: {
                    Button: { template: '<button><slot /></button>', props: ['variant', 'disabled'] },
                    Input: { template: '<input />' },
                    Card: { template: '<div><slot /></div>' },
                    FormField: { template: '<div><slot /></div>' },
                }
            }
        })

        expect(wrapper.text()).toContain('Edit Commitment')
        expect(wrapper.text()).toContain('Save Changes')
    })

    it('displays "Create Commitment" when isEditing is false (default)', () => {
        const wrapper = mount(CreateCommitmentForm, {
            global: {
                stubs: {
                    Button: { template: '<button><slot /></button>' },
                    Input: { template: '<input />' },
                    Card: { template: '<div><slot /></div>' },
                    FormField: { template: '<div><slot /></div>' },
                }
            }
        })

        expect(wrapper.text()).toContain('Create Commitment')
        // Button text contains 'Create Commitment' too
        const btn = wrapper.findAll('button').find(b => b.text() === 'Create Commitment')
        expect(btn).toBeDefined()
    })
})
