export function setupAvatar({
  avatarInput,
  avatarPreview,
  showMessage,
  getCsrfToken,
}) {
  if (!avatarInput || !avatarPreview) {
    return
  }

  avatarInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      showMessage('Veuillez sélectionner une image valide.', 'error')

      avatarInput.value = ''
      return
    }

    // Limite : 5 Mo
    const maxSize = 5 * 1024 * 1024

    if (file.size > maxSize) {
      showMessage('La photo ne doit pas dépasser 5 Mo.', 'error')

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

      showMessage(result.message || 'Photo mise à jour.', 'success')
    } catch (error) {
      avatarPreview.src = previousSrc
      avatarInput.value = ''

      showMessage(error.message || 'Une erreur est survenue.', 'error')
    }
  })
}
