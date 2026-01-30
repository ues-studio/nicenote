import { useEffect, useState } from 'react'

const THEME_KEY = 'nicenote-theme'

type Theme = 'light' | 'dark'

/**
 * Theme management hook
 * 
 * - Default theme: light mode
 * - Reads initial state from DOM (set by index.html script)
 * - Saves user preference to localStorage when changed
 * - Persists across sessions
 * - Overrides Tiptap ThemeToggle's system preference detection
 */
export function useTheme() {
  // Initialize state from current DOM state
  // This matches what index.html already set, preventing any flash
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  })

  // Update DOM and localStorage when theme changes
  useEffect(() => {
    const root = document.documentElement
    const currentIsDark = root.classList.contains('dark')
    const shouldBeDark = theme === 'dark'
    
    // Only update if different to avoid triggering MutationObserver unnecessarily
    if (currentIsDark !== shouldBeDark) {
      if (shouldBeDark) {
        root.classList.add('dark')
        root.setAttribute('data-theme', 'dark')
      } else {
        root.classList.remove('dark')
        root.setAttribute('data-theme', 'light')
      }
    }
    
    // Always sync localStorage (cheap operation)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // Monitor DOM changes from ThemeToggle and sync to our state
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      const newTheme = isDark ? 'dark' : 'light'
      
      // Only update state if different (this will trigger localStorage sync)
      if (newTheme !== theme) {
        setTheme(newTheme)
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggleTheme }
}
