// Fichier principal du profil : il récupère les éléments HTML, prépare ce qui est
// partagé (état, message, token CSRF) puis démarre chaque fonctionnalité du dossier features.

import { applyTheme, getTheme } from './theme.js'
import { setupAvatar } from './features/profile-avatar.js'
import { setupEditMode } from './features/profile-edit-mode.js'
import { setupProfileForm } from './features/profile-form.js'

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
  // VÉRIFICATION DES ÉLÉMENTS OBLIGATOIRES
  // ============================================================

  const requiredElements = [
    ['#profileForm', profileForm],
    ['#fullnameInput', fullnameInput],
    ['#usernameInput', usernameInput],
    ['#bioInput', bioInput],
    ['#editProfileButton', editButton],
    ['#editIcon', editIcon],
    ['#saveActions', saveActions],
  ]

  for (const [selector, element] of requiredElements) {
    if (!element) {
      console.error(`Erreur : ${selector} est introuvable.`)
      return
    }
  }

  // ============================================================
  // ÉTAT PARTAGÉ (mode édition + valeurs originales)
  // ============================================================

  const state = {
    isEditMode: false,
    originalFullName: fullnameInput.value,
    originalUsername: usernameInput.value,
    originalBio: bioInput.value,
  }

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
  // DÉMARRAGE DES FONCTIONNALITÉS
  // ============================================================

  const { disableEditMode } = setupEditMode({
    fullnameInput,
    usernameInput,
    bioInput,
    editButton,
    editIcon,
    saveActions,
    state,
  })

  setupAvatar({
    avatarInput,
    avatarPreview,
    showMessage,
    getCsrfToken,
  })

  setupProfileForm({
    profileForm,
    fullnameInput,
    usernameInput,
    bioInput,
    profileFullName,
    profileUsername,
    profileBio,
    state,
    showMessage,
    getCsrfToken,
    disableEditMode,
  })
})
