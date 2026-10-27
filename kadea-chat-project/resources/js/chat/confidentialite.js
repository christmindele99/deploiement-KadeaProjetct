document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // ÉLÉMENTS
  // ============================================================

  const changePasswordButton =
    document.getElementById('changePasswordButton')

  const resetPasswordButton =
    document.getElementById('resetPasswordButton')

  const passwordMessage =
    document.getElementById('passwordMessage')


  // ============================================================
  // MESSAGE
  // ============================================================

  function showPasswordMessage(message, type = 'success') {
    if (!passwordMessage) return

    passwordMessage.textContent = message

    passwordMessage.classList.remove(
      'hidden',
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-700',
      'border-red-200',
      'bg-red-50',
      'text-red-700'
    )

    if (type === 'success') {
      passwordMessage.classList.add(
        'border-emerald-200',
        'bg-emerald-50',
        'text-emerald-700'
      )
    } else {
      passwordMessage.classList.add(
        'border-red-200',
        'bg-red-50',
        'text-red-700'
      )
    }
  }


  // ============================================================
  // MODIFIER LE MOT DE PASSE
  // ============================================================

  if (changePasswordButton) {
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
                class="rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
              >
                Modifier le mot de passe
              </button>

            </div>

          </form>

        </div>
      `

      document.body.appendChild(modal)

      const form = modal.querySelector('#changePasswordForm')
      const cancelButton =
        modal.querySelector('#cancelChangePassword')

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

        const submitButton =
          modal.querySelector('#submitChangePassword')

        const currentPassword =
          modal.querySelector('#currentPassword').value

        const newPassword =
          modal.querySelector('#newPassword').value

        const confirmPassword =
          modal.querySelector('#confirmPassword').value

        const originalContent = submitButton.innerHTML

        submitButton.disabled = true

        submitButton.innerHTML = `
          <i class="fa-solid fa-spinner fa-spin mr-1"></i>
          Modification...
        `

        try {
          const csrfCookie = document.cookie
            .split('; ')
            .find((cookie) =>
              cookie.startsWith('XSRF-TOKEN=')
            )

          const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }

          if (csrfCookie) {
            headers['X-XSRF-TOKEN'] =
              decodeURIComponent(
                csrfCookie.substring(
                  'XSRF-TOKEN='.length
                )
              )
          }

          const response = await fetch(
            '/profile/change-password',
            {
              method: 'PATCH',
              headers,
              credentials: 'same-origin',
              body: JSON.stringify({
                currentPassword,
                newPassword,
                confirmPassword,
              }),
            }
          )

          const data =
            await response.json().catch(() => ({}))

          if (!response.ok) {
            throw new Error(
              data.message ||
                'Impossible de modifier le mot de passe.'
            )
          }

          closeModal()

          showPasswordMessage(
            data.message ||
              'Votre mot de passe a été modifié avec succès.',
            'success'
          )

        } catch (error) {
          console.error(
            'Erreur de modification du mot de passe :',
            error
          )

          submitButton.disabled = false
          submitButton.innerHTML = originalContent

          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Impossible de modifier le mot de passe.'

          const errorElement =
            modal.querySelector('#changePasswordError')

          if (errorElement) {
            errorElement.textContent = errorMessage
            errorElement.classList.remove('hidden')
          } else {
            const messageElement =
              document.createElement('p')

            messageElement.id =
              'changePasswordError'

            messageElement.className =
              'mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700'

            messageElement.textContent =
              errorMessage

            form.prepend(messageElement)
          }
        }
      })
    })
  }


  // ============================================================
  // RÉINITIALISATION DU MOT DE PASSE PAR E-MAIL
  // ============================================================

  if (resetPasswordButton) {
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

          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <i class="fa-solid fa-rotate-right text-xl"></i>
          </div>

          <h2
            id="resetPasswordModalTitle"
            class="text-lg font-bold text-brand-blue"
          >
            Réinitialiser le mot de passe
          </h2>

          <p class="mt-2 text-sm leading-6 text-slate-600">
            Un lien de réinitialisation sera envoyé à l'adresse e-mail associée à votre compte.
          </p>

          <div
            id="resetPasswordError"
            class="hidden mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          ></div>

          <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              id="cancelResetPassword"
              class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>

            <button
              type="button"
              id="confirmResetPassword"
              class="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              Envoyer le lien
            </button>

          </div>

        </div>
      `

      document.body.appendChild(modal)

      const cancelButton =
        modal.querySelector('#cancelResetPassword')

      const confirmButton =
        modal.querySelector('#confirmResetPassword')

      const errorElement =
        modal.querySelector('#resetPasswordError')

      function closeModal() {
        modal.remove()
        document.body.classList.remove('overflow-hidden')
      }

      cancelButton.addEventListener(
        'click',
        closeModal
      )

      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          closeModal()
        }
      })

      document.body.classList.add('overflow-hidden')

      confirmButton.addEventListener(
        'click',
        async () => {

          const originalContent =
            confirmButton.innerHTML

          confirmButton.disabled = true

          confirmButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin mr-1"></i>
            Envoi...
          `

          errorElement.classList.add('hidden')

          try {
            const csrfCookie = document.cookie
              .split('; ')
              .find((cookie) =>
                cookie.startsWith('XSRF-TOKEN=')
              )

            const headers = {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            }

            if (csrfCookie) {
              headers['X-XSRF-TOKEN'] =
                decodeURIComponent(
                  csrfCookie.substring(
                    'XSRF-TOKEN='.length
                  )
                )
            }

            const response = await fetch(
              '/forgot-password',
              {
                method: 'POST',
                headers,
                credentials: 'same-origin',
              }
            )

            const data =
              await response.json().catch(() => ({}))

            if (!response.ok) {
              throw new Error(
                data.message ||
                  'Impossible d’envoyer le lien de réinitialisation.'
              )
            }

            closeModal()

            showPasswordMessage(
              data.message ||
                'Un lien de réinitialisation a été envoyé à votre adresse e-mail.',
              'success'
            )

          } catch (error) {
            console.error(
              'Erreur de réinitialisation du mot de passe :',
              error
            )

            confirmButton.disabled = false
            confirmButton.innerHTML =
              originalContent

            errorElement.textContent =
              error instanceof Error
                ? error.message
                : 'Impossible d’envoyer le lien de réinitialisation.'

            errorElement.classList.remove(
              'hidden'
            )
          }
        }
      )
    })
  }
})