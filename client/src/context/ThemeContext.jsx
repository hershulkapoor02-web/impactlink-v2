import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('il_theme') || 'system')

  useEffect(() => {
    const root = document.documentElement
    const apply = (t) => {
      if (t === 'dark')  root.classList.add('dark')
      else if (t === 'light') root.classList.remove('dark')
      else {
        // system
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        prefersDark ? root.classList.add('dark') : root.classList.remove('dark')
      }
    }
    apply(theme)
    localStorage.setItem('il_theme', theme)

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e) => apply('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
