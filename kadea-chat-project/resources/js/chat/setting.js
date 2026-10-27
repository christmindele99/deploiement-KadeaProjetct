
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
// AIDE ET COMMENTAIRES
// ============================================================

const helpButton = document.getElementById('helpButton')
const settingsContent = document.getElementById('settingsContent')
const settingsList = document.getElementById('settingsList')

const mainPanel = document.getElementById('mainPanel')
const mainPanelTitle = document.getElementById('mainPanelTitle')
const mainPanelContent = document.getElementById('mainPanelContent')

const helpBackButton = document.getElementById('helpBackButton')

if (
  helpButton &&
  settingsContent &&
  settingsList &&
  mainPanel &&
  mainPanelTitle &&
  mainPanelContent
) {
  const originalSettingsContent = settingsContent.innerHTML

  async function showHelpSection(url, title) {
    try {
      // Afficher le panneau principal
      mainPanel.classList.remove('hidden')
      mainPanel.classList.add('flex')

      // Sur mobile, masquer la liste des paramètres
      if (window.innerWidth < 768) {
        settingsList.classList.add('hidden')
      }

      // Afficher le bouton retour uniquement sur mobile
      if (helpBackButton) {
        helpBackButton.classList.remove('hidden')
        helpBackButton.classList.add('flex')
      }

      // Modifier le titre
      mainPanelTitle.textContent = title

      // État de chargement
      mainPanelContent.innerHTML = `
        <div class="flex min-h-full items-center justify-center">
          <div class="text-center">

            <i class="fa-solid fa-spinner fa-spin text-2xl text-brand-blue"></i>

            <p class="mt-3 text-sm text-slate-500">
              Chargement...
            </p>

          </div>
        </div>
      `

      // Charger le contenu Edge
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/html',
        },
        credentials: 'same-origin',
      })

      if (!response.ok) {
        throw new Error('Impossible de charger cette rubrique.')
      }

      const html = await response.text()

      // Insérer le contenu dans le panneau principal
      mainPanelContent.innerHTML = html

      // Initialiser le formulaire si nécessaire
      if (url === '/commentaire') {
        initializeCommentForm()
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la rubrique :', error)

      mainPanelContent.innerHTML = `
        <div class="flex min-h-full items-center justify-center p-6">
          <div class="max-w-md text-center">

            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <i class="fa-solid fa-circle-exclamation text-2xl"></i>
            </div>

            <h3 class="font-artega text-xl font-bold text-brand-blue">
              Une erreur est survenue
            </h3>

            <p class="mt-2 text-sm leading-6 text-slate-500">
              Impossible de charger cette rubrique. Veuillez réessayer.
            </p>

          </div>
        </div>
      `
    }
  }


  function showSettingsList() {
    // Réafficher la liste des paramètres
    settingsList.classList.remove('hidden')

    // Sur desktop, elle doit rester visible
    if (window.innerWidth >= 768) {
      settingsList.classList.remove('hidden')
    }

    // Masquer le panneau principal sur mobile
    if (window.innerWidth < 768) {
      mainPanel.classList.add('hidden')
      mainPanel.classList.remove('flex')
    }

    // Restaurer le contenu original
    settingsContent.innerHTML = originalSettingsContent

    // Restaurer le titre
    mainPanelTitle.textContent = 'Parametres'

    // Restaurer le contenu d'accueil
    mainPanelContent.innerHTML = `
      <div class="flex min-h-full items-center justify-center text-center">

        <div class="max-w-md">

          <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50">
            <i class="fa-solid fa-gear text-3xl text-brand-blue"></i>
          </div>

          <h3 class="font-artega text-2xl font-bold text-brand-blue">
            Parametres
          </h3>

          <p class="mt-3 text-sm leading-7 text-slate-500">
            Gérez vos informations personnelles et personnalisez votre expérience sur Kadea Chat.
          </p>

        </div>

      </div>
    `

    // Masquer le bouton retour
    if (helpBackButton) {
      helpBackButton.classList.add('hidden')
      helpBackButton.classList.remove('flex')
    }

    // Réinitialiser les événements des boutons
    initializeHelpButton()
  }


  function initializeHelpButton() {
    const button = document.getElementById('helpButton')

    if (button) {
      button.addEventListener('click', showHelpMenu)
    }
  }


  function showHelpMenu() {
    // Cacher les paramètres normaux
    settingsContent.innerHTML = `
      <div class="space-y-2">

        <button
          type="button"
          id="privacyPolicyButton"
          class="flex w-full items-center gap-3.5 rounded-xl border border-transparent bg-transparent px-3 py-[15px] text-left text-brand-blue transition-colors duration-200 hover:border-emerald-100 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
        >

          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-sky-50 text-[17px] text-brand-blue">
            <i class="fa-solid fa-shield-halved"></i>
          </span>

          <span class="min-w-0 flex-1">

            <span class="block text-sm font-semibold">
              Politique de confidentialité
            </span>

            <span class="mt-1 block text-[11px] leading-relaxed text-slate-500">
              Consultez les informations relatives à vos données et à votre vie privée.
            </span>

          </span>

          <i class="fa-solid fa-chevron-right text-xs text-slate-400"></i>

        </button>


        <button
          type="button"
          id="commentButton"
          class="flex w-full items-center gap-3.5 rounded-xl border border-transparent bg-transparent px-3 py-[15px] text-left text-brand-blue transition-colors duration-200 hover:border-emerald-100 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
        >

          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-sky-50 text-[17px] text-brand-blue">
            <i class="fa-solid fa-comment-dots"></i>
          </span>

          <span class="min-w-0 flex-1">

            <span class="block text-sm font-semibold">
              Commentaire
            </span>

            <span class="mt-1 block text-[11px] leading-relaxed text-slate-500">
              Partagez votre expérience et vos suggestions.
            </span>

          </span>

          <i class="fa-solid fa-chevron-right text-xs text-slate-400"></i>

        </button>

      </div>
    `

    // Politique de confidentialité
    const privacyPolicyButton =
      document.getElementById('privacyPolicyButton')

    if (privacyPolicyButton) {
      privacyPolicyButton.addEventListener('click', () => {
        showHelpSection(
          '/politique-confidentialite',
          'Politique de confidentialite'
        )
      })
    }

    // Commentaire
    const commentButton = document.getElementById('commentButton')

    if (commentButton) {
      commentButton.addEventListener('click', () => {
        showHelpSection('/commentaire', 'Commentaire')
      })
    }

    // Sur mobile, afficher directement le panneau principal
    if (window.innerWidth < 768) {
    mainPanel.classList.add('hidden')
    mainPanel.classList.remove('flex')
  }
  }


  // Bouton Aide et commentaires
  // Initialiser le bouton Aide et commentaires
  initializeHelpButton()


  // Bouton retour sur mobile
  if (helpBackButton) {
    helpBackButton.addEventListener('click', () => {
      showSettingsList()
    })
  }


  // Formulaire commentaire
  function initializeCommentForm() {
    const commentForm = document.getElementById('commentForm')
    const ratingStars = document.querySelectorAll('.rating-star')
    const ratingInput = document.getElementById('ratingInput')
    const ratingDescription =
      document.getElementById('ratingDescription')

    const commentInput = document.getElementById('commentInput')
    const commentCounter = document.getElementById('commentCounter')

    if (!commentForm) {
      return
    }

    // Gestion des étoiles
    ratingStars.forEach((star) => {
      star.addEventListener('click', () => {
        const rating = Number(star.dataset.rating)

        ratingInput.value = rating

        ratingStars.forEach((item) => {
          const itemRating = Number(item.dataset.rating)

          if (itemRating <= rating) {
            item.classList.remove('text-slate-300')
            item.classList.add('text-brand-accent')
            item.setAttribute('aria-checked', 'true')
          } else {
            item.classList.remove('text-brand-accent')
            item.classList.add('text-slate-300')
            item.setAttribute('aria-checked', 'false')
          }
        })

        ratingDescription.textContent =
          `${rating} étoile${rating > 1 ? 's' : ''} sélectionnée${rating > 1 ? 's' : ''}.`
      })
    })

    // Compteur du commentaire
    if (commentInput && commentCounter) {
      commentInput.addEventListener('input', () => {
        commentCounter.textContent =
          `${commentInput.value.length} / 1000`
      })
    }

    // Annuler
    const cancelCommentButton =
      document.getElementById('cancelCommentButton')

    if (cancelCommentButton) {
      cancelCommentButton.addEventListener('click', () => {
        showHelpMenu()
      })
    }

    // Envoi temporaire
    commentForm.addEventListener('submit', (event) => {
      event.preventDefault()

      alert(
        'Le formulaire fonctionne correctement. L’enregistrement du commentaire sera ajouté prochainement.'
      )
    })
  }
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
