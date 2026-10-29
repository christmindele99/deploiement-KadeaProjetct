import { exitConversationSelectionMode, openChatWithUser, setActiveNavigation } from './conversations.js'
import { app, closeNewChatButton, contactSearch, mobileNewChatButton, newChatContacts, newChatModal, openNewChatButton, state, usersButton, usersPanelList, usersSearch } from './state.js'
import { api, getCurrentUserId, getData, getUserInitials, isMobile } from './utils.js'

// ==================================================
// UTILISATEURS
// ==================================================

function showUsersMessage(
  message,
  isError = false,
  containers = [newChatContacts, usersPanelList]
) {
  containers.forEach((container) => {
    if (!container) {
      return
    }

    container.replaceChildren()

    const paragraph = document.createElement('p')

    paragraph.className = 'py-4 text-center text-sm'
    paragraph.classList.add(isError ? 'text-red-500' : 'text-gray-500')
    paragraph.textContent = message

    container.appendChild(paragraph)
  })
}

export function createUserElement(user) {
  const item = document.createElement('button')

  item.type = 'button'
  item.dataset.startChat = String(user.id)

  item.className =
    'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-emerald-50'

  const avatarContainer = document.createElement('div')

  avatarContainer.className =
    'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#075e8d] text-sm font-semibold text-white'

  if (user.avatar) {
    const avatar = document.createElement('img')

    avatar.src = user.avatar
    avatar.alt = ''
    avatar.className = 'h-full w-full object-cover'

    avatar.addEventListener(
      'error',
      () => {
        avatar.remove()
        avatarContainer.textContent = getUserInitials(user)
      },
      { once: true }
    )

    avatarContainer.appendChild(avatar)
  } else {
    avatarContainer.textContent = getUserInitials(user)
  }

  const details = document.createElement('div')
  details.className = 'min-w-0 flex-1'

  const name = document.createElement('p')
  name.className =
    'truncate text-sm font-semibold text-slate-800'
  name.textContent =
    user.fullName || user.username || 'Utilisateur'

  const username = document.createElement('p')
  username.className =
    'truncate text-xs text-slate-500'
  username.textContent = user.username
    ? `@${user.username}`
    : ''

  details.append(name, username)

  if (user.bio) {
    const bio = document.createElement('p')
    bio.className =
      'mt-1 truncate text-xs text-slate-400'
    bio.textContent = user.bio
    details.appendChild(bio)
  }

  item.append(avatarContainer, details)

  return item
}

function renderUsersList(container, query = '') {
  if (!container) {
    return
  }

  const currentUserId = getCurrentUserId()
  const normalizedQuery = query.trim().toLowerCase()

  const filteredUsers = state.registeredUsers
    .filter((user) => Number(user.id) !== Number(currentUserId))
    .filter((user) => {
      const fullName = (user.fullName || '').toLowerCase()
      const username = (user.username || '').toLowerCase()

      return (
        fullName.includes(normalizedQuery) ||
        username.includes(normalizedQuery)
      )
    })

  container.replaceChildren()

  if (!filteredUsers.length) {
    showUsersMessage(
      normalizedQuery
        ? 'Aucun utilisateur ne correspond à ta recherche.'
        : 'Aucun autre utilisateur inscrit pour le moment.',
      false,
      [container]
    )

    return
  }

  filteredUsers.forEach((user) => {
    container.appendChild(createUserElement(user))
  })
}

// Met à jour la liste de la modale ET celle du panneau Utilisateurs
function renderRegisteredUsers() {
  renderUsersList(newChatContacts, contactSearch?.value || '')
  renderUsersList(usersPanelList, usersSearch?.value || '')
}

export async function loadRegisteredUsers() {
  if (state.usersLoading) {
    return
  }

  state.usersLoading = true
  showUsersMessage('Chargement des utilisateurs...')

  try {
    const result = await api('/users')

    state.registeredUsers = getData(result)

    renderRegisteredUsers(contactSearch?.value || '')
  } catch (error) {
    if (error.message !== 'SESSION_EXPIRED') {
      showUsersMessage(
        'Impossible de charger les utilisateurs.',
        true
      )
    } else {
      window.location.reload()
    }
  } finally {
    state.usersLoading = false
  }
}

function openNewChatModal() {
  if (!newChatModal) {
    return
  }

  newChatModal.classList.remove('hidden')
  newChatModal.classList.add('flex')

  loadRegisteredUsers()
}

export function closeNewChatModal() {
  if (!newChatModal) {
    return
  }

  newChatModal.classList.add('hidden')
  newChatModal.classList.remove('flex')
}


// ==================================================
// MODE UTILISATEURS (desktop)
// ==================================================

export function enterUsersMode() {
  if (isMobile() || state.usersMode) {
    return
  }

  exitConversationSelectionMode()

  state.usersMode = true
  app.classList.add('users-mode')

  if (usersSearch) {
    usersSearch.value = ''
  }

  loadRegisteredUsers()
}

function exitUsersMode() {
  if (!state.usersMode) {
    return
  }

  state.usersMode = false
  app.classList.remove('users-mode')

  setActiveNavigation('chats')
}

// Branche les écouteurs d'événements de cette fonctionnalité
export function setupUsers() {
  openNewChatButton?.addEventListener(
    'click',
    openNewChatModal
  )

  mobileNewChatButton?.addEventListener(
    'click',
    openNewChatModal
  )

  closeNewChatButton?.addEventListener(
    'click',
    closeNewChatModal
  )

  newChatModal?.addEventListener('click', (event) => {
    if (event.target === newChatModal) {
      closeNewChatModal()
    }
  })

  contactSearch?.addEventListener('input', () => {
    renderRegisteredUsers(contactSearch.value)
  })

    // ----- Mode Utilisateurs (desktop) -----
    usersButton?.addEventListener('click', (event) => {
    // Sur la page du chat on reste sur la page ; ailleurs le lien mène à /chat#users
    event.preventDefault()
    enterUsersMode()
  })

  usersSearch?.addEventListener('input', () => {
    renderRegisteredUsers()
  })

  usersPanelList?.addEventListener('click', (event) => {
    const target = event.target

    if (!(target instanceof Element)) {
      return
    }

    const button = target.closest('[data-start-chat]')

    if (!button) {
      return
    }

    const user = state.registeredUsers.find(
      (item) => String(item.id) === button.dataset.startChat
    )

    if (!user || Number(user.id) === Number(getCurrentUserId())) {
      return
    }

    exitUsersMode()
    openChatWithUser(user)
  })

  // Icône Chats : revenir aux conversations sans recharger la page
  document
    .querySelectorAll('[data-section="chats"]')
    .forEach((link) => {
      link.addEventListener('click', (event) => {
        if (!state.usersMode) {
          return
        }

        event.preventDefault()
        exitUsersMode()
      })
    })

  // Si la fenêtre devient mobile, on quitte le mode Utilisateurs
  window.addEventListener('resize', () => {
    if (isMobile()) {
      exitUsersMode()
    }
  })

}
