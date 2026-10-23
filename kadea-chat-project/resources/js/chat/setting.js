
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
  // DÉCONNEXION
  // ============================================================

  const logoutButton = document.getElementById('logoutButton')

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      const originalContent = logoutButton.innerHTML

      logoutButton.disabled = true
      logoutButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin text-base"></i>
        <span>Déconnexion...</span>
      `

      try {
        // Récupérer le jeton CSRF depuis le cookie
        const csrfCookie = document.cookie
          .split('; ')
          .find((cookie) => cookie.startsWith('XSRF-TOKEN='))

        const headers = {
          Accept: 'application/json',
        }

        if (csrfCookie) {
          headers['X-XSRF-TOKEN'] = decodeURIComponent(
            csrfCookie.substring('XSRF-TOKEN='.length)
          )
        }

        // Envoyer la demande de déconnexion au serveur
        const response = await fetch('/logout', {
          method: 'POST',
          headers,
          credentials: 'same-origin',
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(
            data.message || 'La déconnexion a échoué. Réessaie.'
          )
        }

        // Remplacer la page actuelle par l'interface de connexion
        window.location.replace(data.redirectTo || '/login')
      } catch (error) {
        console.error('Erreur de déconnexion :', error)

        // Réactiver le bouton en cas d'erreur
        logoutButton.disabled = false
        logoutButton.innerHTML = originalContent

        // Afficher un message d'erreur
        const toast = document.getElementById('toast')

        if (toast) {
          toast.textContent =
            error.message || 'Impossible de se déconnecter.'

          toast.classList.remove('hidden')
          toast.setAttribute('role', 'alert')
        } else {
          alert(error.message || 'Impossible de se déconnecter.')
        }
      }
    })
  }
})
