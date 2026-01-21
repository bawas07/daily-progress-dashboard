// Date formatting utilities
export function formatDate(date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = new Date(date)

  if (format === 'time') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// Day of week utilities
export const DAYS_OF_WEEK = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export function isToday(dayIndex: number): boolean {
  return new Date().getDay() === dayIndex
}

export function getDayName(day: string): string {
  const names: Record<string, string> = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
  }
  return names[day] || day
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Local storage utilities
export function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue

  const stored = localStorage.getItem(key)
  if (stored === null) return defaultValue

  try {
    return JSON.parse(stored)
  } catch {
    return defaultValue
  }
}

export function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}
