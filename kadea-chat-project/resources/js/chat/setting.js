// Fichier principal des paramètres : il importe chaque fonctionnalité du dossier features et les démarre

import { setupHelp } from './features/setting-help.js'
import { setupLogout } from './features/setting-logout.js'
import { setupTheme } from './features/setting-theme.js'

document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // NAVIGATION VERS LE PROFIL
  // ============================================================

  const btnModifierProfil = document.getElementById('modifierProfil')

  if (btnModifierProfil) {
    btnModifierProfil.addEventListener('click', (event) => {
      event.preventDefault()

      // Redirection vers la route du profil
      window.location.href = 'profile'
    })
  }

  // ============================================================
  // DÉMARRAGE DES FONCTIONNALITÉS
  // ============================================================

  setupHelp() // Aide et commentaires
  setupLogout() // Déconnexion
  setupTheme() // Thème clair / sombre
})
