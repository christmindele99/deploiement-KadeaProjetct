import { applyTheme, getTheme } from './theme.js'

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
    avatarInput.addEventListener('change', async (event) => {
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
      const previousSrc = avatarPreview.src

      const reader = new FileReader()

      reader.onload = () => {
        avatarPreview.src = reader.result
      }

      reader.readAsDataURL(file)

      // Envoi au serveur
      const formData = new FormData()
      formData.append('avatar', file)

      try {
        const csrfToken = getCsrfToken()
        const headers = { Accept: 'application/json' }

        if (csrfToken) {
          headers['X-XSRF-TOKEN'] = csrfToken
        }

        const response = await fetch('/profile/avatar', {
          method: 'PATCH',
          headers,
          credentials: 'same-origin',
          body: formData,
        })

        const result = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(
            result.message || "Impossible d'enregistrer la photo."
          )
        }

        avatarPreview.src = result.data.avatar

        showMessage(
          result.message || 'Photo mise à jour.',
          'success'
        )
      } catch (error) {
        avatarPreview.src = previousSrc
        avatarInput.value = ''

        showMessage(
          error.message || 'Une erreur est survenue.',
          'error'
        )
      }
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
})