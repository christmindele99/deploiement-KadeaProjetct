// Utilitaires partagés : message de retour et en-têtes de requête (jeton CSRF)

// ============================================================
// MESSAGE
// ============================================================

export function showPasswordMessage(message, type = 'success') {
  const passwordMessage = document.getElementById('passwordMessage')

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
// TOKEN CSRF
// ============================================================

export function getRequestHeaders() {
  const csrfCookie = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('XSRF-TOKEN='))

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  if (csrfCookie) {
    headers['X-XSRF-TOKEN'] = decodeURIComponent(
      csrfCookie.substring('XSRF-TOKEN='.length)
    )
  }

  return headers
}
