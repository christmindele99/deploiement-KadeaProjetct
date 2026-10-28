// Mode édition du profil : activer, désactiver, bouton Modifier et bouton Annuler
export function setupEditMode({
  fullnameInput,
  usernameInput,
  bioInput,
  editButton,
  editIcon,
  saveActions,
  state,
}) {
  // ============================================================
  // ACTIVER LE MODE ÉDITION
  // ============================================================

  function enableEditMode() {
    state.isEditMode = true

    // Sauvegarder les valeurs actuelles avant modification
    state.originalFullName = fullnameInput.value
    state.originalUsername = usernameInput.value
    state.originalBio = bioInput.value

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
    state.isEditMode = false

    // Restaurer les anciennes valeurs si demandé
    if (restoreValues) {
      fullnameInput.value = state.originalFullName
      usernameInput.value = state.originalUsername
      bioInput.value = state.originalBio
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
    if (state.isEditMode) {
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

  const cancelButton = saveActions.querySelector('button[type="button"]')

  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      disableEditMode(true)
    })
  }

  // profile-form.js a besoin de disableEditMode après l'enregistrement
  return { enableEditMode, disableEditMode }
}
