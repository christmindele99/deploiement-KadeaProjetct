const THEME_KEY = 'kadea-theme'

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light'
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(THEME_KEY, theme)
}