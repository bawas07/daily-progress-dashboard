export type ThemePreference = 'auto' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

let mediaQuery: MediaQueryList | null = null
let mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyResolvedTheme(theme: ResolvedTheme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.setAttribute('data-theme', theme)
}

function cleanupAutoThemeListener(): void {
  if (!mediaQuery || !mediaQueryListener) return

  if (typeof mediaQuery.removeEventListener === 'function') {
    mediaQuery.removeEventListener('change', mediaQueryListener)
  } else {
    mediaQuery.removeListener(mediaQueryListener)
  }

  mediaQuery = null
  mediaQueryListener = null
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'auto') {
    return getSystemTheme()
  }
  return preference
}

export function applyTheme(preference: ThemePreference): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  cleanupAutoThemeListener()

  if (preference === 'auto') {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    applyResolvedTheme(getSystemTheme())

    mediaQueryListener = (event: MediaQueryListEvent) => {
      applyResolvedTheme(event.matches ? 'dark' : 'light')
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', mediaQueryListener)
    } else {
      mediaQuery.addListener(mediaQueryListener)
    }

    return
  }

  applyResolvedTheme(preference)
}

