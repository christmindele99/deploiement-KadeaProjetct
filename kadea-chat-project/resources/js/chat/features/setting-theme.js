import { applyTheme, getTheme } from '../theme.js'


export function syncThemeUI(theme) {
  const themeSwitch = document.getElementById('themeSwitch')
  const themeDescription = document.getElementById('themeDescription')

  if (!themeSwitch || !themeDescription) return

  const isDark = theme === 'dark'

  themeSwitch.setAttribute('aria-checked', String(isDark))
  themeSwitch.setAttribute(
    'aria-label',
    isDark ? 'Activer le thème clair' : 'Activer le thème sombre'
  )
  themeDescription.textContent = isDark ? 'Thème sombre' : 'Thème clair'
}


export function setupTheme() {
  syncThemeUI(getTheme())

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#themeSwitch')) return

    const next = getTheme() === 'dark' ? 'light' : 'dark'

    applyTheme(next)
    syncThemeUI(next)
  })
}
