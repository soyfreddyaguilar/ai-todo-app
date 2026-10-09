import { useCallback, useEffect, useState } from 'react'

export const THEME_STORAGE_KEY = 'todos-app-theme'
export const THEMES = { LIGHT: 'light', DARK: 'dark' }

function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return value === THEMES.LIGHT || value === THEMES.DARK ? value : null
  } catch {
    return null
  }
}

function systemPrefersDark() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

// Stored preference wins; otherwise follow the system colour scheme (FR8).
export function useTheme() {
  const [theme, setTheme] = useState(
    () =>
      readStoredTheme() ?? (systemPrefersDark() ? THEMES.DARK : THEMES.LIGHT),
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (error) {
      // The theme still applies for this session; only persistence is lost.
      console.error('Could not save theme preference', error)
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) =>
      current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK,
    )
  }, [])

  return { theme, toggleTheme }
}
