
document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // RÉCUPÉRATION DES ÉLÉMENTS HTML
  // ============================================================

  const profileForm = document.getElementById('profileForm')

  const fullnameInput = document.getElementById('fullnameInput')
  const usernameInput = document.getElementById('usernameInput')
  const bioInput = document.getElementById('bioInput')

  const avatarInput = document.getElementById('avatarInput')
  const avatarPreview = document.getElementById('avatarPreview')

  const editButton = document.getElementById('editProfileButton')
  const editIcon = document.getElementById('editIcon')

  const saveActions = document.getElementById('saveActions')

  const profileMessage = document.getElementById('profileMessage')

  const profileFullName = document.getElementById('profileFullName')
  const profileUsername = document.getElementById('profileUsername')
  const profileBio = document.getElementById('profileBio')

  // Boutons de sécurité existants
  const changePasswordButton = document.getElementById('changePasswordButton')
  const resetPasswordButton = document.getElementById('resetPasswordButton')


  // ============================================================
  // VÉRIFICATION DES ÉLÉMENTS
  // ============================================================

  if (!profileForm) {
    console.error('Erreur : #profileForm est introuvable.')
    return
  }

  if (!fullnameInput) {
    console.error('Erreur : #fullnameInput est introuvable.')
    return
  }

  if (!usernameInput) {
    console.error('Erreur : #usernameInput est introuvable.')
    return
  }

  if (!bioInput) {
    console.error('Erreur : #bioInput est introuvable.')
    return
  }

  if (!editButton) {
    console.error('Erreur : #editProfileButton est introuvable.')
    return
  }

  if (!editIcon) {
    console.error('Erreur : #editIcon est introuvable.')
    return
  }

  if (!saveActions) {
    console.error('Erreur : #saveActions est introuvable.')
    return
  }


  // ============================================================
  // ÉTAT DU MODE ÉDITION
  // ============================================================

  let isEditMode = false


  // ============================================================
  // VALEURS ORIGINALES
  // ============================================================

  let originalFullName = fullnameInput.value
  let originalUsername = usernameInput.value
  let originalBio = bioInput.value


  // ============================================================
  // TOKEN CSRF
  // ============================================================

  function getCsrfToken() {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))

    if (!token) {
      return null
    }

    return decodeURIComponent(token.split('=')[1])
  }


  // ============================================================
  // AFFICHER UN MESSAGE
  // ============================================================

  function showMessage(message, type = 'success') {
    if (!profileMessage) {
      return
    }

    profileMessage.textContent = message

    profileMessage.classList.remove(
      'hidden',
      'bg-emerald-50',
      'text-emerald-700',
      'border-emerald-200',
      'bg-red-50',
      'text-red-700',
      'border-red-200'
    )

    if (type === 'success') {
      profileMessage.classList.add(
        'bg-emerald-50',
        'text-emerald-700',
        'border',
        'border-emerald-200'
      )
    } else {
      profileMessage.classList.add(
        'bg-red-50',
        'text-red-700',
        'border',
        'border-red-200'
      )
    }

    setTimeout(() => {
      profileMessage.classList.add('hidden')
    }, 4000)
  }


  // ============================================================
  // ACTIVER LE MODE ÉDITION
  // ============================================================

  function enableEditMode() {
    isEditMode = true

    // Sauvegarder les valeurs actuelles avant modification
    originalFullName = fullnameInput.value
    originalUsername = usernameInput.value
    originalBio = bioInput.value

    // Activer les champs modifiables
    fullnameInput.disabled = false
    usernameInput.disabled = false
    bioInput.disabled = false

    // Modifier l'apparence des champs
    fullnameInput.classList.remove('bg-slate-50')
    usernameInput.classList.remove('bg-slate-50')
    bioInput.classList.remove('bg-slate-50')

    fullnameInput.classList.add('bg-white')
    usernameInput.classList.add('bg-white')
    bioInput.classList.add('bg-white')

    // Changer l'icône stylo en X
    editIcon.classList.remove('fa-pen')
    editIcon.classList.add('fa-xmark')

    // Afficher les boutons Annuler / Enregistrer
    saveActions.classList.remove('hidden')
    saveActions.classList.add('flex')

    // Placer le curseur dans le nom complet
    fullnameInput.focus()
  }


  // ============================================================
  // DÉSACTIVER LE MODE ÉDITION
  // ============================================================

  function disableEditMode(restoreValues = true) {
    isEditMode = false

    // Restaurer les anciennes valeurs si demandé
    if (restoreValues) {
      fullnameInput.value = originalFullName
      usernameInput.value = originalUsername
      bioInput.value = originalBio
    }

    // Désactiver les champs
    fullnameInput.disabled = true
    usernameInput.disabled = true
    bioInput.disabled = true

    // Restaurer l'apparence des champs
    fullnameInput.classList.remove('bg-white')
    usernameInput.classList.remove('bg-white')
    bioInput.classList.remove('bg-white')

    fullnameInput.classList.add('bg-slate-50')
    usernameInput.classList.add('bg-slate-50')
    bioInput.classList.add('bg-slate-50')

    // Remettre le stylo
    editIcon.classList.remove('fa-xmark')
    editIcon.classList.add('fa-pen')

    // Cacher les boutons
    saveActions.classList.remove('flex')
    saveActions.classList.add('hidden')
  }


  // ============================================================
  // CLIC SUR LE BOUTON MODIFIER
  // ============================================================

  editButton.addEventListener('click', () => {
    if (isEditMode) {
      // Si on est déjà en mode édition,
      // le bouton devient un bouton Annuler rapide.
      disableEditMode(true)
    } else {
      enableEditMode()
    }
  })


  // ============================================================
  // BOUTON ANNULER
  // ============================================================

  const cancelButton = saveActions.querySelector(
    'button[type="button"]'
  )

  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      disableEditMode(true)
    })
  }


  // ============================================================
  // PRÉVISUALISATION DE L'AVATAR
  // ============================================================

  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0]

      if (!file) {
        return
      }

      // Vérifier que c'est une image
      if (!file.type.startsWith('image/')) {
        showMessage(
          'Veuillez sélectionner une image valide.',
          'error'
        )

        avatarInput.value = ''
        return
      }

      // Limite : 5 Mo
      const maxSize = 5 * 1024 * 1024

      if (file.size > maxSize) {
        showMessage(
          'La photo ne doit pas dépasser 5 Mo.',
          'error'
        )

        avatarInput.value = ''
        return
      }

      // Prévisualisation
      const reader = new FileReader()

      reader.onload = () => {
        avatarPreview.src = reader.result
      }

      reader.readAsDataURL(file)
    })
  }


  // ============================================================
  // ENREGISTRER LES MODIFICATIONS DU PROFIL
  // ============================================================

  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const fullName = fullnameInput.value.trim()
    const username = usernameInput.value.trim()
    const bio = bioInput.value.trim()


    // ------------------------------------------------------------
    // VALIDATION DU NOM
    // ------------------------------------------------------------

    if (fullName.length < 2) {
      showMessage(
        'Le nom complet doit contenir au moins 2 caractères.',
        'error'
      )

      fullnameInput.focus()
      return
    }


    // ------------------------------------------------------------
    // VALIDATION DU USERNAME
    // ------------------------------------------------------------

    if (username.length < 3) {
      showMessage(
        "Le nom d'utilisateur doit contenir au moins 3 caractères.",
        'error'
      )

      usernameInput.focus()
      return
    }


    // ------------------------------------------------------------
    // BOUTON ENREGISTRER
    // ------------------------------------------------------------

    const submitButton = profileForm.querySelector(
      'button[type="submit"]'
    )

    const originalButtonText = submitButton?.textContent

    if (submitButton) {
      submitButton.disabled = true
      submitButton.textContent = 'Enregistrement...'
    }


    // ------------------------------------------------------------
    // ENVOI AU SERVEUR
    // ------------------------------------------------------------

    try {
      const csrfToken = getCsrfToken()

      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }

      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken
      }

      const response = await fetch('/profile', {
        method: 'PATCH',
        headers,
        credentials: 'same-origin',

        body: JSON.stringify({
          fullName,
          username,
          bio,
        }),
      })

      const result = await response.json()


      // ----------------------------------------------------------
      // GESTION DES ERREURS SERVEUR
      // ----------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Impossible de modifier votre profil.'
        )
      }


      // ----------------------------------------------------------
      // UTILISATEUR MIS À JOUR
      // ----------------------------------------------------------

      const updatedUser = result.data


      // ----------------------------------------------------------
      // METTRE À JOUR LES VALEURS ORIGINALES
      // ----------------------------------------------------------

      originalFullName = updatedUser.fullName || ''
      originalUsername = updatedUser.username || ''
      originalBio = updatedUser.bio || ''

      // Mettre à jour les champs
      fullnameInput.value = originalFullName
      usernameInput.value = originalUsername
      bioInput.value = originalBio


      // ----------------------------------------------------------
      // METTRE À JOUR L'EN-TÊTE DU PROFIL
      // ----------------------------------------------------------

      if (profileFullName) {
        profileFullName.textContent = updatedUser.fullName
      }

      if (profileUsername) {
        profileUsername.innerHTML =
          `<span>@</span>${updatedUser.username}`
      }

      if (profileBio) {
        profileBio.textContent =
          updatedUser.bio ||
          'Aucune biographie renseignée.'
      }


      // ----------------------------------------------------------
      // QUITTER LE MODE ÉDITION
      // ----------------------------------------------------------

      disableEditMode(false)


      // ----------------------------------------------------------
      // MESSAGE DE SUCCÈS
      // ----------------------------------------------------------

      showMessage(
        result.message ||
        'Votre profil a été mis à jour avec succès.',
        'success'
      )

    } catch (error) {
      console.error(
        'Erreur lors de la modification du profil :',
        error
      )

      showMessage(
        error.message ||
        'Une erreur est survenue.',
        'error'
      )

    } finally {
      if (submitButton) {
        submitButton.disabled = false

        submitButton.textContent =
          originalButtonText ||
          'Enregistrer les modifications'
      }
    }
  })


  // ============================================================
  // NOUVEAU : MODIFIER LE MOT DE PASSE
  // ============================================================

  if (changePasswordButton) {
    let passwordContainer = null
    let passwordForm = null

    changePasswordButton.addEventListener('click', () => {
      // Si le formulaire existe déjà, simplement l'afficher ou le masquer.
      if (passwordContainer) {
        passwordContainer.classList.toggle('hidden')
        return
      }

      // Créer le formulaire sans modifier le formulaire du profil.
      passwordContainer = document.createElement('div')

      passwordContainer.className =
        'mt-4 rounded-xl border border-slate-200 bg-white p-4'

      passwordContainer.innerHTML = `
        <h3 class="mb-4 text-sm font-semibold text-brand-blue">
          Modifier le mot de passe
        </h3>

        <form id="passwordChangeForm" class="space-y-4">
          <div>
            <label
              for="currentPassword"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              Mot de passe actuel
            </label>

            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              autocomplete="current-password"
              required
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
            >
          </div>

          <div>
            <label
              for="newPassword"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              Nouveau mot de passe
            </label>

            <input
              type="password"
              id="newPassword"
              name="newPassword"
              autocomplete="new-password"
              minlength="8"
              required
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
            >

            <p class="mt-1 text-xs text-slate-500">
              8 caractères minimum, une majuscule, une minuscule,
              un chiffre et un caractère spécial.
            </p>
          </div>

          <div>
            <label
              for="confirmPassword"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              Confirmer le nouveau mot de passe
            </label>

            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              autocomplete="new-password"
              required
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
            >
          </div>

          <p
            id="passwordChangeMessage"
            class="hidden rounded-lg border p-3 text-sm"
            role="status"
            aria-live="polite"
          ></p>

          <div class="flex flex-wrap gap-2">
            <button
              type="submit"
              class="rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-brand-blue transition hover:opacity-90"
            >
              Enregistrer le nouveau mot de passe
            </button>

            <button
              type="button"
              id="cancelPasswordChange"
              class="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </form>
      `

      // Insérer le formulaire après la rangée des boutons de sécurité.
      changePasswordButton.parentElement.insertAdjacentElement(
        'afterend',
        passwordContainer
      )

      passwordForm = passwordContainer.querySelector(
        '#passwordChangeForm'
      )

      const currentPasswordInput =
        passwordContainer.querySelector('#currentPassword')

      const newPasswordInput =
        passwordContainer.querySelector('#newPassword')

      const confirmPasswordInput =
        passwordContainer.querySelector('#confirmPassword')

      const passwordChangeMessage =
        passwordContainer.querySelector('#passwordChangeMessage')

      const cancelPasswordChange =
        passwordContainer.querySelector('#cancelPasswordChange')


      // ----------------------------------------------------------
      // AFFICHER UN MESSAGE POUR LE MOT DE PASSE
      // ----------------------------------------------------------

      function showPasswordMessage(message, type = 'error') {
        passwordChangeMessage.textContent = message

        passwordChangeMessage.classList.remove(
          'hidden',
          'bg-emerald-50',
          'text-emerald-700',
          'border-emerald-200',
          'bg-red-50',
          'text-red-700',
          'border-red-200'
        )

        if (type === 'success') {
          passwordChangeMessage.classList.add(
            'bg-emerald-50',
            'text-emerald-700',
            'border-emerald-200'
          )
        } else {
          passwordChangeMessage.classList.add(
            'bg-red-50',
            'text-red-700',
            'border-red-200'
          )
        }
      }


      // ----------------------------------------------------------
      // ANNULER LE CHANGEMENT DU MOT DE PASSE
      // ----------------------------------------------------------

      cancelPasswordChange.addEventListener('click', () => {
        passwordForm.reset()
        passwordContainer.classList.add('hidden')
        passwordChangeMessage.classList.add('hidden')
      })


      // ----------------------------------------------------------
      // ENVOYER LA DEMANDE AU CONTRÔLEUR
      // ----------------------------------------------------------

      passwordForm.addEventListener('submit', async (event) => {
        event.preventDefault()

        const currentPassword = currentPasswordInput.value
        const newPassword = newPasswordInput.value
        const confirmPassword = confirmPasswordInput.value

        // Vérifier les champs
        if (!currentPassword || !newPassword || !confirmPassword) {
          showPasswordMessage('Veuillez remplir tous les champs.')
          return
        }

        // Vérifier la robustesse du nouveau mot de passe
        const passwordIsValid =
          newPassword.length >= 8 &&
          /[a-z]/.test(newPassword) &&
          /[A-Z]/.test(newPassword) &&
          /\d/.test(newPassword) &&
          /[^A-Za-z0-9]/.test(newPassword)

        if (!passwordIsValid) {
          showPasswordMessage(
            'Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
          )
          return
        }

        // Vérifier la confirmation
        if (newPassword !== confirmPassword) {
          showPasswordMessage(
            'Les deux nouveaux mots de passe ne correspondent pas.'
          )
          return
        }

        const submitButton = passwordForm.querySelector(
          'button[type="submit"]'
        )

        const originalButtonText = submitButton.textContent

        submitButton.disabled = true
        submitButton.textContent = 'Modification en cours...'

        try {
          const csrfToken = getCsrfToken()

          const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }

          if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken
          }

          const response = await fetch('/profile/change-password', {
            method: 'PATCH',
            headers,
            credentials: 'same-origin',
            body: JSON.stringify({
              currentPassword,
              newPassword,
              confirmPassword,
            }),
          })

          const result = await response.json().catch(() => ({}))

          if (!response.ok) {
            throw new Error(
              result.message ||
              'Impossible de modifier le mot de passe.'
            )
          }

          showPasswordMessage(
            result.message ||
            'Votre mot de passe a été modifié avec succès.',
            'success'
          )

          passwordForm.reset()

          // Fermer le formulaire après la confirmation.
          setTimeout(() => {
            passwordContainer?.classList.add('hidden')
          }, 2500)

        } catch (error) {
          console.error(
            'Erreur lors du changement du mot de passe :',
            error
          )

          showPasswordMessage(
            error.message ||
            'Une erreur est survenue. Veuillez réessayer.',
            'error'
          )

        } finally {
          submitButton.disabled = false
          submitButton.textContent = originalButtonText
        }
      })

      currentPasswordInput.focus()
    })
  }


  
  // ============================================================
  // RÉINITIALISATION DU MOT DE PASSE PAR E-MAIL
  // ============================================================

  if (resetPasswordButton) {
    let resetModal = null

    function closeResetModal() {
      if (resetModal) {
        resetModal.classList.add('hidden')
        document.body.classList.remove('overflow-hidden')
      }
    }

    function showResetStep(step) {
      const confirmationStep = resetModal.querySelector('#resetConfirmationStep')
      const emailStep = resetModal.querySelector('#resetEmailStep')
      const resultStep = resetModal.querySelector('#resetResultStep')

      confirmationStep.classList.toggle('hidden', step !== 'confirmation')
      emailStep.classList.toggle('hidden', step !== 'email')
      resultStep.classList.toggle('hidden', step !== 'result')
    }

    function createResetModal() {
      const modal = document.createElement('div')

      modal.id = 'resetPasswordModal'
      modal.className =
        'fixed inset-0 z-[100] hidden items-center justify-center bg-black/50 px-4 py-6'

      modal.innerHTML = `
        <div
          class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resetPasswordModalTitle"
        >
          <!-- Étape 1 : confirmation -->
          <div id="resetConfirmationStep">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <i class="fa-solid fa-rotate-right text-xl"></i>
            </div>

            <h2
              id="resetPasswordModalTitle"
              class="text-lg font-bold text-brand-blue"
            >
              Réinitialiser le mot de passe ?
            </h2>

            <p class="mt-2 text-sm leading-6 text-slate-600">
              Tu vas recevoir un lien par e-mail pour choisir un nouveau mot
              de passe. Veux-tu continuer ?
            </p>

            <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                id="cancelResetConfirmation"
                class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="button"
                id="confirmResetPassword"
                class="rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Oui, continuer
              </button>
            </div>
          </div>

          <!-- Étape 2 : adresse e-mail -->
          <div id="resetEmailStep" class="hidden">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <i class="fa-solid fa-envelope text-xl"></i>
            </div>

            <h2 class="text-lg font-bold text-brand-blue">
              Réinitialisation du mot de passe
            </h2>

            <p class="mt-2 text-sm leading-6 text-slate-600">
              Saisis l'adresse e-mail associée à ton compte. Si elle correspond
              à un compte, tu recevras un lien de réinitialisation.
            </p>

            <form id="resetPasswordEmailForm" class="mt-5 space-y-4">
              <div>
                <label
                  for="resetPasswordEmail"
                  class="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Adresse e-mail
                </label>

                <input
                  type="email"
                  id="resetPasswordEmail"
                  name="email"
                  placeholder="votre@gmail.com"
                  autocomplete="email"
                  required
                  class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>

              <p
                id="resetPasswordError"
                class="hidden rounded-lg bg-red-50 p-3 text-sm text-red-600"
                role="alert"
              ></p>

              <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  id="cancelResetEmail"
                  class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  id="sendResetEmailButton"
                  class="rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Envoyer le lien
                </button>
              </div>
            </form>
          </div>

          <!-- Étape 3 : résultat -->
          <div id="resetResultStep" class="hidden">
            <div
              id="resetResultIcon"
              class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
            >
              <i class="fa-solid fa-check text-xl"></i>
            </div>

            <h2
              id="resetResultTitle"
              class="text-lg font-bold text-brand-blue"
            >
              Demande traitée
            </h2>

            <p
              id="resetResultMessage"
              class="mt-2 text-sm leading-6 text-slate-600"
              role="status"
              aria-live="polite"
            ></p>

            <div class="mt-6 flex justify-end">
              <button
                type="button"
                id="closeResetResult"
                class="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          closeResetModal()
        }
      })

      modal.querySelector('#cancelResetConfirmation').addEventListener(
        'click',
        closeResetModal
      )

      modal.querySelector('#cancelResetEmail').addEventListener(
        'click',
        closeResetModal
      )

      modal.querySelector('#closeResetResult').addEventListener(
        'click',
        closeResetModal
      )

      modal.querySelector('#confirmResetPassword').addEventListener(
        'click',
        () => {
          showResetStep('email')

          const emailInput = modal.querySelector('#resetPasswordEmail')
          emailInput.value = ''
          emailInput.focus()
        }
      )

      modal.querySelector('#resetPasswordEmailForm').addEventListener(
        'submit',
        async (event) => {
          event.preventDefault()

          const emailInput = modal.querySelector('#resetPasswordEmail')
          const submitButton = modal.querySelector('#sendResetEmailButton')
          const errorMessage = modal.querySelector('#resetPasswordError')
          const email = emailInput.value.trim()

          errorMessage.textContent = ''
          errorMessage.classList.add('hidden')

          if (!emailInput.checkValidity()) {
            emailInput.reportValidity()
            return
          }

          const csrfToken = getCsrfToken()

          submitButton.disabled = true
          submitButton.textContent = 'Envoi en cours...'
          submitButton.classList.add('opacity-60', 'cursor-not-allowed')

          try {
            const headers = {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            }

            if (csrfToken) {
              headers['X-XSRF-TOKEN'] = csrfToken
            }

            const response = await fetch('/forgot-password', {
              method: 'POST',
              headers,
              credentials: 'same-origin',
              body: JSON.stringify({ email }),
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
              throw new Error(
                data.message ||
                  "Impossible d'envoyer l'e-mail. Réessaie plus tard."
              )
            }

            modal.querySelector('#resetResultTitle').textContent =
              'Demande traitée'

            modal.querySelector('#resetResultMessage').textContent =
              data.message ||
              "Si cette adresse correspond à un compte, un lien de réinitialisation sera envoyé."

            modal.querySelector('#resetResultIcon').className =
              'mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'

            modal.querySelector('#resetResultIcon').innerHTML =
              '<i class="fa-solid fa-check text-xl"></i>'

            showResetStep('result')
          } catch (error) {
            errorMessage.textContent =
              error.message ||
              "Une erreur est survenue. Vérifie ta connexion et réessaie."

            errorMessage.classList.remove('hidden')
          } finally {
            submitButton.disabled = false
            submitButton.textContent = 'Envoyer le lien'
            submitButton.classList.remove(
              'opacity-60',
              'cursor-not-allowed'
            )
          }
        }
      )

      return modal
    }

    resetPasswordButton.addEventListener('click', () => {
      if (!resetModal) {
        resetModal = createResetModal()
      }

      showResetStep('confirmation')
      resetModal.classList.remove('hidden')
      resetModal.classList.add('flex')
      document.body.classList.add('overflow-hidden')
    })

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && resetModal) {
        closeResetModal()
      }
    })
  }

})
