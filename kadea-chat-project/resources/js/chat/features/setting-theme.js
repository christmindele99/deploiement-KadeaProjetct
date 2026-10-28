// Thème clair / sombre : mise à jour de l'interrupteur et changement de thème

import { applyTheme, getTheme } from '../theme.js'

// ============================================================
// SYNCHRONISER L'INTERFACE AVEC LE THÈME
// ============================================================

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

// ============================================================
// INTERRUPTEUR DU THÈME
// ============================================================

export function setupTheme() {
  syncThemeUI(getTheme())

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#themeSwitch')) return

    const next = getTheme() === 'dark' ? 'light' : 'dark'

    applyTheme(next)
    syncThemeUI(next)
  })
}
