import { THEMES } from '../hooks/useTheme.js'

export default function Header({ theme, onToggleTheme }) {
  const isDark = theme === THEMES.DARK

  return (
    <header className="app-header">
      <h1>TODO App</h1>
      <button
        type="button"
        className="theme-toggle"
        data-testid="theme-toggle"
        onClick={onToggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? 'Light mode' : 'Dark mode'}
      </button>
    </header>
  )
}
