const THEME_STORAGE_KEY =
  'malios_theme'


export function getSavedTheme() {
  return (
    localStorage.getItem(
      THEME_STORAGE_KEY,
    ) || 'system'
  )
}


export function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches
      ? 'dark'
      : 'light'
  }

  return theme
}


export function applyTheme(theme) {
  const resolvedTheme =
    resolveTheme(theme)

  document.documentElement.setAttribute(
    'data-theme',
    resolvedTheme,
  )

  localStorage.setItem(
    THEME_STORAGE_KEY,
    theme,
  )
}