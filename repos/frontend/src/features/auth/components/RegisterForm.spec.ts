import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RegisterForm from './RegisterForm.vue'

describe('RegisterForm', () => {
    it('renders register form properly', () => {
        const wrapper = mount(RegisterForm)
        expect(wrapper.find('form').exists()).toBe(true)
        expect(wrapper.find('input[id="name"]').exists()).toBe(true)
        expect(wrapper.find('input[id="email"]').exists()).toBe(true)
        expect(wrapper.find('input[id="password"]').exists()).toBe(true)
        expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('validates inputs sequentially', async () => {
        const wrapper = mount(RegisterForm)
        const form = wrapper.find('form')

        // Empty form
        await form.trigger('submit.prevent')
        expect(wrapper.text()).toContain('Name is required')

        // Fill name, check email
        await wrapper.find('input[id="name"]').setValue('John Doe')
        await form.trigger('submit.prevent')
        expect(wrapper.text()).toContain('Email is required')

        // Fill email, check password
        await wrapper.find('input[id="email"]').setValue('john@example.com')
        await form.trigger('submit.prevent')
        expect(wrapper.text()).toContain('Password is required')

        // Check password complexity
        await wrapper.find('input[id="password"]').setValue('12345678')
        await form.trigger('submit.prevent')
        expect(wrapper.text()).toContain('Password must contain at least one uppercase letter')

        await wrapper.find('input[id="password"]').setValue('password')
        await form.trigger('submit.prevent')
        expect(wrapper.text()).toContain('Password must contain at least one uppercase letter')

        await wrapper.find('input[id="password"]').setValue('Password')
        await form.trigger('submit.prevent')
        expect(wrapper.text()).toContain('Password must contain at least one number')
    })

    it('emits submit event with valid data', async () => {
        const wrapper = mount(RegisterForm)

        await wrapper.find('input[id="name"]').setValue('John Doe')
        await wrapper.find('input[id="email"]').setValue('john@example.com')
        await wrapper.find('input[id="password"]').setValue('Password123!')

        await wrapper.find('form').trigger('submit.prevent')

        expect(wrapper.emitted()).toHaveProperty('submit')
        expect(wrapper.emitted('submit')?.[0]).toEqual([{
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password123!'
        }])
    })

    it('displays error prop message', () => {
        const wrapper = mount(RegisterForm, {
            props: {
                error: 'Registration failed'
            }
        })
        expect(wrapper.text()).toContain('Registration failed')
    })

    it('disables submit button while loading', () => {
        const wrapper = mount(RegisterForm, {
            props: {
                loading: true
            }
        })
        const button = wrapper.find('button[type="submit"]')
        expect(button.attributes('disabled')).toBeDefined()
        expect(button.text()).toContain('Loading')
    })
})
