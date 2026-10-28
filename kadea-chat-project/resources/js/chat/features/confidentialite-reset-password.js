// Réinitialisation du mot de passe par e-mail : modale, validation et envoi au serveur

import { getRequestHeaders, showPasswordMessage } from './confidentialite-utils.js'

export function setupResetPassword() {
  const resetPasswordButton = document.getElementById('resetPasswordButton')

  if (!resetPasswordButton) {
    return
  }

  resetPasswordButton.addEventListener('click', () => {
    const modal = document.createElement('div')

    modal.id = 'resetPasswordModal'
    modal.className =
      'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6'

    modal.innerHTML = `
      <div
        class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resetPasswordModalTitle"
      >
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#075e8d] text-white">
          <i class="fa-solid fa-rotate-right text-xl"></i>
        </div>

        <h2
          id="resetPasswordModalTitle"
          class="text-lg font-bold text-brand-blue"
        >
          Réinitialiser le mot de passe
        </h2>

        <p class="mt-2 text-sm leading-6 text-slate-600">
          Saisissez l'adresse e-mail associée à votre compte. Un lien de réinitialisation vous sera envoyé si cette adresse correspond à un compte.
        </p>

        <form id="resetPasswordForm" class="mt-5 space-y-4">
          <div>
            <label
              for="resetPasswordEmail"
              class="mb-1 block text-xs font-semibold text-slate-600"
            >
              Adresse e-mail
            </label>

            <input
              type="email"
              id="resetPasswordEmail"
              name="email"
              required
              autocomplete="email"
              placeholder="exemple@email.com"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-brand-blue focus:border-brand-accent focus:bg-white focus:outline-none"
            >
          </div>

          <div
            id="resetPasswordError"
            class="hidden rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            role="alert"
          ></div>

          <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              id="cancelResetPassword"
              class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              id="confirmResetPassword"
              class="rounded-xl bg-[#29ff9d] px-4 py-2.5 text-sm font-semibold text-[#075e8d] hover:bg-[#20e88c] disabled:opacity-60"
            >
              Envoyer le lien
            </button>
          </div>
        </form>
      </div>
    `

    document.body.appendChild(modal)

    const form = modal.querySelector('#resetPasswordForm')
    const emailInput = modal.querySelector('#resetPasswordEmail')
    const cancelButton = modal.querySelector('#cancelResetPassword')
    const confirmButton = modal.querySelector('#confirmResetPassword')
    const errorElement = modal.querySelector('#resetPasswordError')

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

      const email = emailInput.value.trim()

      if (!email) {
        errorElement.textContent = 'Veuillez saisir une adresse e-mail valide.'
        errorElement.classList.remove('hidden')
        emailInput.focus()
        return
      }

      const originalContent = confirmButton.innerHTML

      confirmButton.disabled = true
      confirmButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin mr-1"></i>
        Envoi...
      `

      errorElement.classList.add('hidden')

      try {
        const response = await fetch('/forgot-password', {
          method: 'POST',
          headers: getRequestHeaders(),
          credentials: 'same-origin',
          body: JSON.stringify({ email }),
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Impossible d’envoyer le lien de réinitialisation.'
          )
        }

        closeModal()

        showPasswordMessage(
          data.message ||
            'Si cette adresse correspond à un compte, un lien de réinitialisation sera envoyé.',
          'success'
        )
      } catch (error) {
        console.error('Erreur de réinitialisation du mot de passe :', error)

        confirmButton.disabled = false
        confirmButton.innerHTML = originalContent

        errorElement.textContent =
          error instanceof Error
            ? error.message
            : 'Impossible d’envoyer le lien de réinitialisation.'

        errorElement.classList.remove('hidden')
      }
    })
  })
}
