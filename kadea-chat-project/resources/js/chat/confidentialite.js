// Fichier principal de la confidentialité : il importe chaque fonctionnalité du dossier features et les démarre

import { setupChangePassword } from './features/confidentialite-change-password.js'
import { setupResetPassword } from './features/confidentialite-reset-password.js'

document.addEventListener('DOMContentLoaded', () => {
  setupChangePassword() // Modifier le mot de passe
  setupResetPassword() // Réinitialisation par e-mail
})
