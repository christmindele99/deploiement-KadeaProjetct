
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
    async function performLogout() {
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
    }
        let logoutModal = null

    function closeLogoutModal() {
      if (!logoutModal) return

      logoutModal.classList.add('hidden')
      logoutModal.classList.remove('flex')
      document.body.classList.remove('overflow-hidden')
    }

    function createLogoutModal() {
      const modal = document.createElement('div')

      modal.id = 'logoutModal'
      modal.className =
        'fixed inset-0 z-[100] hidden items-center justify-center bg-black/50 px-4 py-6'

      modal.innerHTML = `
        <div
          class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logoutModalTitle"
        >
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <i class="fa-solid fa-right-from-bracket text-xl"></i>
          </div>

          <h2 id="logoutModalTitle" class="text-lg font-bold text-brand-blue">
            Se déconnecter ?
          </h2>

          <p class="mt-2 text-sm leading-6 text-slate-600">
            Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
          </p>

          <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              id="cancelLogout"
              class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </button>

            <button
              type="button"
              id="confirmLogout"
              class="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Confirmer
            </button>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      // Clic en dehors de la boîte = annuler
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          closeLogoutModal()
        }
      })

      modal
        .querySelector('#cancelLogout')
        .addEventListener('click', closeLogoutModal)

      modal.querySelector('#confirmLogout').addEventListener('click', () => {
        closeLogoutModal()
        performLogout()
      })

      return modal
    }

    logoutButton.addEventListener('click', () => {
      if (!logoutModal) {
        logoutModal = createLogoutModal()
      }

      logoutModal.classList.remove('hidden')
      logoutModal.classList.add('flex')
      document.body.classList.add('overflow-hidden')
    })

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeLogoutModal()
      }
    })
  }
})
