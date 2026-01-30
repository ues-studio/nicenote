import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'

export function ThemeToggle() {
  // Initialize from DOM state (set by index.html and useTheme hook)
  // This ensures ThemeToggle reflects the user's saved preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const toggleDarkMode = () => setIsDarkMode((isDark) => !isDark)

  return (
    <button
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      className="p-2 rounded-md hover:bg-accent transition-colors"
    >
      {isDarkMode ? (
        <MoonIcon className="w-5 h-5" />
      ) : (
        <SunIcon className="w-5 h-5" />
      )}
    </button>
  )
}
