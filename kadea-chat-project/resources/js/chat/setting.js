import { setupHelp } from './features/setting-help.js'
import { setupLogout } from './features/setting-logout.js'
import { setupTheme } from './features/setting-theme.js'

document.addEventListener('DOMContentLoaded', () => {
  const btnModifierProfil = document.getElementById('modifierProfil')

  if (btnModifierProfil) {
    btnModifierProfil.addEventListener('click', (event) => {
      event.preventDefault()

      window.location.href = 'profile'
    })
  }
  
  setupHelp() 
  setupLogout() 
  setupTheme() 
})
