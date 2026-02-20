import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginForm from './LoginForm.vue'

describe('LoginForm', () => {
    it('renders login form properly', () => {
        const wrapper = mount(LoginForm)
        expect(wrapper.find('form').exists()).toBe(true)
        expect(wrapper.find('input[type="email"]').exists()).toBe(true)
        expect(wrapper.find('input[type="password"]').exists()).toBe(true)
        expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('validates email and password inputs', async () => {
        const wrapper = mount(LoginForm)
        const form = wrapper.find('form')

        // Submit empty form
        await form.trigger('submit.prevent')

        // Check validation messages
        expect(wrapper.text()).toContain('Email is required')

        // Fill email to check password validation
        await wrapper.find('input[type="email"]').setValue('test@example.com')
        await form.trigger('submit.prevent')

        expect(wrapper.text()).toContain('Password is required')
    })

    it('emits submit event with valid data', async () => {
        const wrapper = mount(LoginForm)
        const emailInput = wrapper.find('input[type="email"]')
        const passwordInput = wrapper.find('input[type="password"]')

        await emailInput.setValue('test@example.com')
        await passwordInput.setValue('password123')

        await wrapper.find('form').trigger('submit.prevent')

        expect(wrapper.emitted()).toHaveProperty('submit')
        expect(wrapper.emitted('submit')?.[0]).toEqual([{
            email: 'test@example.com',
            password: 'password123'
        }])
    })

    it('displays error prop message', () => {
        const wrapper = mount(LoginForm, {
            props: {
                error: 'Invalid credentials'
            }
        })
        expect(wrapper.text()).toContain('Invalid credentials')
    })

    it('disables submit button while loading', () => {
        const wrapper = mount(LoginForm, {
            props: {
                loading: true
            }
        })
        const button = wrapper.find('button[type="submit"]')
        expect(button.attributes('disabled')).toBeDefined()
        expect(button.text()).toContain('Signing in')
    })
})
