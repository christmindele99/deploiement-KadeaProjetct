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

  function enableEditMode() {
    state.isEditMode = true

    state.originalFullName = fullnameInput.value
    state.originalUsername = usernameInput.value
    state.originalBio = bioInput.value

    fullnameInput.disabled = false
    usernameInput.disabled = false
    bioInput.disabled = false

    fullnameInput.classList.remove('bg-slate-50')
    usernameInput.classList.remove('bg-slate-50')
    bioInput.classList.remove('bg-slate-50')

    fullnameInput.classList.add('bg-white')
    usernameInput.classList.add('bg-white')
    bioInput.classList.add('bg-white')

    // Changer l'icône stylo en X
    editIcon.classList.remove('fa-pen')
    editIcon.classList.add('fa-xmark')

    saveActions.classList.remove('hidden')
    saveActions.classList.add('flex')

    fullnameInput.focus()
  }


  function disableEditMode(restoreValues = true) {
    state.isEditMode = false

    // Restaurer les anciennes valeurs si demandé
    if (restoreValues) {
      fullnameInput.value = state.originalFullName
      usernameInput.value = state.originalUsername
      bioInput.value = state.originalBio
    }

    fullnameInput.disabled = true
    usernameInput.disabled = true
    bioInput.disabled = true

    fullnameInput.classList.remove('bg-white')
    usernameInput.classList.remove('bg-white')
    bioInput.classList.remove('bg-white')

    fullnameInput.classList.add('bg-slate-50')
    usernameInput.classList.add('bg-slate-50')
    bioInput.classList.add('bg-slate-50')

    editIcon.classList.remove('fa-xmark')
    editIcon.classList.add('fa-pen')

    saveActions.classList.remove('flex')
    saveActions.classList.add('hidden')
  }


  editButton.addEventListener('click', () => {
    if (state.isEditMode) {
      disableEditMode(true)
    } else {
      enableEditMode()
    }
  })


  const cancelButton = saveActions.querySelector('button[type="button"]')

  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      disableEditMode(true)
    })
  }

  return { enableEditMode, disableEditMode }
}
