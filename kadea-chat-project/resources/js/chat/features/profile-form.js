
export function setupProfileForm({
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
}) {
  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const fullName = fullnameInput.value.trim()
    const username = usernameInput.value.trim()
    const bio = bioInput.value.trim()


    if (fullName.length < 2) {
      showMessage('Le nom complet doit contenir au moins 2 caractères.', 'error')

      fullnameInput.focus()
      return
    }


    if (username.length < 3) {
      showMessage("Le nom d'utilisateur doit contenir au moins 3 caractères.", 'error')

      usernameInput.focus()
      return
    }


    const submitButton = profileForm.querySelector('button[type="submit"]')

    const originalButtonText = submitButton?.textContent

    if (submitButton) {
      submitButton.disabled = true
      submitButton.textContent = 'Enregistrement...'
    }


    try {
      const csrfToken = getCsrfToken()

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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

      if (!response.ok) {
        throw new Error(result.message || 'Impossible de modifier votre profil.')
      }

      const updatedUser = result.data

      // Mettre à jour les valeurs originales
      state.originalFullName = updatedUser.fullName || ''
      state.originalUsername = updatedUser.username || ''
      state.originalBio = updatedUser.bio || ''

      // Mettre à jour les champs
      fullnameInput.value = state.originalFullName
      usernameInput.value = state.originalUsername
      bioInput.value = state.originalBio


      if (profileFullName) {
        profileFullName.textContent = updatedUser.fullName
      }

      if (profileUsername) {
        profileUsername.innerHTML = `<span>@</span>${updatedUser.username}`
      }

      if (profileBio) {
        profileBio.textContent = updatedUser.bio || 'Aucune biographie renseignée.'
      }

      disableEditMode(false)


      showMessage(result.message || 'Votre profil a été mis à jour avec succès.', 'success')
    } catch (error) {
      console.error('Erreur lors de la modification du profil :', error)

      showMessage(error.message || 'Une erreur est survenue.', 'error')
    } finally {
      if (submitButton) {
        submitButton.disabled = false

        submitButton.textContent = originalButtonText || 'Enregistrer les modifications'
      }
    }
  })
}
