// Modifier le mot de passe : modale, vérification de la confirmation et envoi au serveur

import { getRequestHeaders, showPasswordMessage } from './confidentialite-utils.js'

export function setupChangePassword() {
  const changePasswordButton = document.getElementById('changePasswordButton')

  if (!changePasswordButton) {
    return
  }

  changePasswordButton.addEventListener('click', () => {
    const modal = document.createElement('div')

    modal.id = 'changePasswordModal'
    modal.className =
      'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6'

    modal.innerHTML = `
      <div
        class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="changePasswordModalTitle"
      >
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-brand-blue">
          <i class="fa-solid fa-key text-xl"></i>
        </div>

        <h2
          id="changePasswordModalTitle"
          class="text-lg font-bold text-brand-blue"
        >
          Modifier le mot de passe
        </h2>

        <p class="mt-2 text-sm leading-6 text-slate-600">
          Entrez votre mot de passe actuel puis choisissez un nouveau mot de passe sécurisé.
        </p>

        <form id="changePasswordForm" class="mt-5 space-y-4">
          <div>
            <label
              for="currentPassword"
              class="mb-1 block text-xs font-semibold text-slate-600"
            >
              Mot de passe actuel
            </label>

            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              required
              autocomplete="current-password"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-brand-blue focus:border-brand-accent focus:bg-white focus:outline-none"
            >
          </div>

          <div>
            <label
              for="newPassword"
              class="mb-1 block text-xs font-semibold text-slate-600"
            >
              Nouveau mot de passe
            </label>

            <input
              type="password"
              id="newPassword"
              name="newPassword"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-brand-blue focus:border-brand-accent focus:bg-white focus:outline-none"
            >

            <p class="mt-1 text-[11px] leading-5 text-slate-400">
              8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un caractère spécial.
            </p>
          </div>

          <div>
            <label
              for="confirmPassword"
              class="mb-1 block text-xs font-semibold text-slate-600"
            >
              Confirmer le nouveau mot de passe
            </label>

            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-brand-blue focus:border-brand-accent focus:bg-white focus:outline-none"
            >
          </div>

          <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              id="cancelChangePassword"
              class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              id="submitChangePassword"
              class="rounded-xl bg-[#29ff9d] px-4 py-2.5 text-sm font-semibold text-[#075e8d] hover:bg-[#20e88c] disabled:opacity-60"
            >
              Modifier le mot de passe
            </button>
          </div>
        </form>
      </div>
    `

    document.body.appendChild(modal)

    const form = modal.querySelector('#changePasswordForm')
    const cancelButton = modal.querySelector('#cancelChangePassword')

    function closeModal() {
      modal.remove()
      document.body.classList.remove('overflow-hidden')
    }

    cancelButton.addEventListener('click', closeModal)

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal()
      }
    })

    document.body.classList.add('overflow-hidden')

    form.addEventListener('submit', async (event) => {
      event.preventDefault()

      const submitButton = modal.querySelector('#submitChangePassword')
      const currentPassword = modal.querySelector('#currentPassword').value
      const newPassword = modal.querySelector('#newPassword').value
      const confirmPassword = modal.querySelector('#confirmPassword').value

      let errorElement = modal.querySelector('#changePasswordError')

      if (newPassword !== confirmPassword) {
        if (!errorElement) {
          errorElement = document.createElement('p')
          errorElement.id = 'changePasswordError'
          errorElement.className =
            'rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700'
          form.prepend(errorElement)
        }

        errorElement.textContent =
          'Les nouveaux mots de passe ne correspondent pas.'
        errorElement.classList.remove('hidden')
        return
      }

      const originalContent = submitButton.innerHTML

      submitButton.disabled = true
      submitButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin mr-1"></i>
        Modification...
      `

      if (errorElement) {
        errorElement.classList.add('hidden')
      }

      try {
        const response = await fetch('/profile/change-password', {
          method: 'PATCH',
          headers: getRequestHeaders(),
          credentials: 'same-origin',
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(
            data.message || 'Impossible de modifier le mot de passe.'
          )
        }

        closeModal()

        showPasswordMessage(
          data.message || 'Votre mot de passe a été modifié avec succès.',
          'success'
        )
      } catch (error) {
        console.error('Erreur de modification du mot de passe :', error)

        submitButton.disabled = false
        submitButton.innerHTML = originalContent

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Impossible de modifier le mot de passe.'

        if (!errorElement) {
          errorElement = document.createElement('p')
          errorElement.id = 'changePasswordError'
          errorElement.className =
            'rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700'
          form.prepend(errorElement)
        }

        errorElement.textContent = errorMessage
        errorElement.classList.remove('hidden')
      }
    })
  })
}
