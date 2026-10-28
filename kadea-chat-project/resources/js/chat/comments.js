function getCsrfToken() {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith('XSRF-TOKEN='))

  return cookie ? decodeURIComponent(cookie.substring('XSRF-TOKEN='.length)) : ''
}

export async function sendComment({ rating, comment }) {
  const response = await fetch('/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-XSRF-TOKEN': getCsrfToken(),
    },
    credentials: 'same-origin',
    body: JSON.stringify({ rating, comment }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || "Impossible d'envoyer le commentaire.")
  }

  return data
}

export function showFlash(message, type = 'success') {
  const oldFlash = document.getElementById('flashMessage')
  if (oldFlash) oldFlash.remove()

  const isSuccess = type === 'success'

  const flash = document.createElement('div')
  flash.id = 'flashMessage'
  flash.setAttribute('role', 'status')
  flash.className =
    'fixed left-1/2 top-5 z-[100] flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-opacity duration-300 ' +
    (isSuccess
      ? 'border-emerald-400 bg-emerald-600/85'
      : 'border-red-400 bg-red-600/85')

  flash.innerHTML = `
    <i class="fa-solid ${isSuccess ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
    <span></span>
  `
  flash.querySelector('span').textContent = message
  flash.style.opacity = '0'

  document.body.appendChild(flash)

  requestAnimationFrame(() => {
    flash.style.opacity = '1'
  })

  setTimeout(() => {
    flash.style.opacity = '0'
    setTimeout(() => flash.remove(), 300)
  }, 3500)
}