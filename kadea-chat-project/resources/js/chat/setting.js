document.addEventListener('DOMContentLoaded', () => {
  const btnModifierProfil = document.getElementById('modifierProfil')

  if (btnModifierProfil) {
    btnModifierProfil.addEventListener('click', (event) => {
      event.preventDefault()
      // Redirection vers la route du profil
      window.location.href = 'profile'
    })
  }
})