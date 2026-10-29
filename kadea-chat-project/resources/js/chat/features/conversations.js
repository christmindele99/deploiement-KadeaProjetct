import { cancelEditingMessage, closeDeleteMessagesConfirmation, closeMessageMenu, exitMessageSelectionMode, hideMessageActions, loadMessages } from './messages.js'
import { subscribeToConversation, unsubscribeFromConversation } from './realtime.js'
import { cancelConversationSelection, cancelDeleteConfirmButton, chatContent, chatItems, chatSearch, closeDeleteConfirmButton, conversationList, conversationSelectionCount, conversationSelectionHeader, deleteConfirmButton, deleteConfirmMessage, deleteConfirmModal, deleteConfirmTitle, deleteConversationsError, deleteMessagesConfirmModal, deleteSelectedConversationsButton, emptyChatState, mainPanel, messageInput, messageList, mobileBackToChats, mobileNavigation, newChatContacts, selectedConversationIds, state } from './state.js'
import { closeNewChatModal } from './users.js'
import { $, api, formatTime, getConversationById, getConversationName, getConversationUser, getCurrentUserId, getData, getMessageConversationId, getMessageDateTimestamp, getMessageDateValue, getMessageText, getUserInitials, isMobile, sortMessages } from './utils.js'

// ==================================================
// LAYOUT
// ==================================================

function showConversationList() {
  hideMessageActions()
  exitMessageSelectionMode()
  cancelEditingMessage()

  conversationList.classList.remove('hidden')

  if (isMobile()) {
    mainPanel.classList.add('hidden')
    mainPanel.classList.remove('flex')
  } else {
    mainPanel.classList.remove('hidden')
    mainPanel.classList.add('flex')

    emptyChatState.classList.remove('hidden')
    chatContent.classList.add('hidden')
    chatContent.classList.remove('flex')
  }

  mobileNavigation?.classList.remove('hidden')
}

function showChatPanel() {
  mainPanel.classList.remove('hidden')
  mainPanel.classList.add('flex')

  if (isMobile()) {
    conversationList.classList.add('hidden')
    mobileNavigation?.classList.add('hidden')
  } else {
    conversationList.classList.remove('hidden')
    mobileNavigation?.classList.remove('hidden')
  }
}

export function initializeLayout() {
  hideMessageActions()
  exitMessageSelectionMode()

  emptyChatState.classList.remove('hidden')
  chatContent.classList.add('hidden')
  chatContent.classList.remove('flex')

  conversationList.classList.remove('hidden')

  if (isMobile()) {
    mainPanel.classList.add('hidden')
    mainPanel.classList.remove('flex')
  } else {
    mainPanel.classList.remove('hidden')
    mainPanel.classList.add('flex')
  }

  mobileNavigation?.classList.remove('hidden')
}

// ==================================================
// MENU D'ACTIONS D'UNE CONVERSATION
// ==================================================

function closeConversationMenu() {
  state.openConversationMenuId = null

  document
    .querySelectorAll('[data-conversation-menu]')
    .forEach((menu) => menu.remove())
}

function createConversationMenu(conversationId) {
  const menu = document.createElement('div')

  menu.dataset.conversationMenu = String(conversationId)

  menu.className =
    'absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg'

  const deleteButton = document.createElement('button')

  deleteButton.type = 'button'
  deleteButton.dataset.conversationMenuAction = 'delete'
  deleteButton.dataset.conversationId = String(conversationId)

  deleteButton.className =
    'flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-red-50 hover:text-red-600'

  const deleteIcon = document.createElement('i')
  deleteIcon.className =
    'fa-solid fa-trash w-5 text-center text-red-500'

  const deleteText = document.createElement('span')
  deleteText.textContent = 'Supprimer la conversation'

  deleteButton.append(deleteIcon, deleteText)

  const selectButton = document.createElement('button')

  selectButton.type = 'button'
  selectButton.dataset.conversationMenuAction = 'select'

  selectButton.className =
    'flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-brand-blue'

  const selectIcon = document.createElement('i')
  selectIcon.className =
    'fa-solid fa-check w-5 text-center text-brand-blue'

  const selectText = document.createElement('span')
  selectText.textContent = 'Sélectionner les conversations'
  selectButton.append(selectIcon, selectText)

      const isFavorite = Boolean(getConversationById(conversationId)?.favorite)

  const favoriteButton = document.createElement('button')

  favoriteButton.type = 'button'
  favoriteButton.dataset.conversationMenuAction = 'favorite'
  favoriteButton.dataset.conversationId = String(conversationId)

  favoriteButton.className =
    'flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-amber-50 hover:text-amber-600'

  const favoriteIcon = document.createElement('i')
  favoriteIcon.className = 'fa-solid fa-star w-5 text-center text-amber-400'

  const favoriteText = document.createElement('span')
  favoriteText.textContent = isFavorite
    ? 'Retirer des favoris'
    : 'Ajouter aux favoris'

  favoriteButton.append(favoriteIcon, favoriteText)
  menu.append(favoriteButton, deleteButton, selectButton)

  return menu
}

function openConversationMenu(conversationId, actionsButton) {
  if (state.conversationSelectionMode) {
    return
  }

  closeConversationMenu()

  const conversation = getConversationById(conversationId)

  if (!conversation) {
    return
  }

  const timeContainer = actionsButton.closest('.relative')

  if (!timeContainer) {
    return
  }

  const menu = createConversationMenu(conversationId)

  timeContainer.appendChild(menu)
  state.openConversationMenuId = Number(conversationId)
}

// ==================================================
// SÉLECTION DES CONVERSATIONS
// ==================================================

function updateSelectionUI() {
  conversationList
    .querySelectorAll('.chat-item')
    .forEach((item) => {
      const conversationId = Number(
        item.dataset.conversationId
      )

      const checkbox = item.querySelector(
        '[data-conversation-checkbox]'
      )

      const actionsButton = item.querySelector(
        '[data-conversation-actions]'
      )

      const isSelected = selectedConversationIds.has(
        conversationId
      )

      if (checkbox) {
        checkbox.checked = isSelected

        checkbox.classList.toggle(
          'hidden',
          !state.conversationSelectionMode
        )
      }

      item.classList.toggle(
        'bg-slate-50',
        state.conversationSelectionMode && isSelected
      )

      if (actionsButton) {
        actionsButton.classList.toggle(
          'hidden',
          state.conversationSelectionMode
        )

        actionsButton.classList.toggle(
          'flex',
          !state.conversationSelectionMode
        )
      }
    })

  if (conversationSelectionHeader) {
    conversationSelectionHeader.classList.toggle(
      'hidden',
      !state.conversationSelectionMode
    )

    conversationSelectionHeader.classList.toggle(
      'flex',
      state.conversationSelectionMode
    )
  }

  if (conversationSelectionCount) {
    conversationSelectionCount.textContent = String(
      selectedConversationIds.size
    )
  }

  if (deleteSelectedConversationsButton) {
    deleteSelectedConversationsButton.disabled =
      selectedConversationIds.size === 0 ||
      state.deletingConversations
  }
}

function enterConversationSelectionMode() {
  closeConversationMenu()

  state.conversationSelectionMode = true
  selectedConversationIds.clear()

  updateSelectionUI()
}

export function exitConversationSelectionMode() {
  state.conversationSelectionMode = false
  selectedConversationIds.clear()

  closeConversationMenu()
  updateSelectionUI()
}

function toggleConversationSelection(conversationId) {
  const id = Number(conversationId)

  if (!Number.isFinite(id) || id <= 0) {
    return
  }

  if (selectedConversationIds.has(id)) {
    selectedConversationIds.delete(id)
  } else {
    selectedConversationIds.add(id)
  }

  updateSelectionUI()
}

function getSelectedConversationIds() {
  return Array.from(selectedConversationIds)
}

// ==================================================
// MODALE DE SUPPRESSION DES CONVERSATIONS
// ==================================================

function showDeleteConfirmation(ids) {
  if (
    !deleteConfirmModal ||
    !deleteConfirmTitle ||
    !deleteConfirmMessage ||
    !deleteConfirmButton
  ) {
    return
  }

  const validIds = [
    ...new Set(
      ids
        .map(Number)
        .filter((id) => Number.isFinite(id) && id > 0)
    ),
  ].filter((id) => getConversationById(id))

  if (!validIds.length || state.deletingConversations) {
    return
  }

  state.pendingDeleteConversationIds = validIds

  if (deleteConversationsError) {
    deleteConversationsError.textContent = ''
    deleteConversationsError.classList.add('hidden')
  }

  if (validIds.length === 1) {
    const conversation = getConversationById(validIds[0])
    const name = getConversationName(conversation)

    deleteConfirmTitle.textContent =
      'Supprimer la conversation'

    deleteConfirmMessage.textContent =
      `Veux-tu vraiment supprimer la conversation avec ${name} ? Cette action est irréversible.`
  } else {
    deleteConfirmTitle.textContent =
      'Supprimer les conversations'

    deleteConfirmMessage.textContent =
      `Veux-tu vraiment supprimer les ${validIds.length} conversations sélectionnées ? Cette action est irréversible.`
  }

  deleteConfirmButton.disabled = false
  deleteConfirmButton.innerHTML =
    '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Supprimer</span>'

  deleteConfirmModal.classList.remove('hidden')
  deleteConfirmModal.classList.add('flex')
}

function closeDeleteConfirmation() {
  if (!deleteConfirmModal || state.deletingConversations) {
    return
  }

  deleteConfirmModal.classList.add('hidden')
  deleteConfirmModal.classList.remove('flex')

  state.pendingDeleteConversationIds = []

  if (deleteConversationsError) {
    deleteConversationsError.textContent = ''
    deleteConversationsError.classList.add('hidden')
  }
}

// ==================================================
// CONFIRMATION DE SUPPRESSION DES CONVERSATIONS
// ==================================================

async function confirmDeleteConversations() {
  if (
    state.deletingConversations ||
    !state.pendingDeleteConversationIds.length
  ) {
    return
  }

  const ids = [...state.pendingDeleteConversationIds]

  state.deletingConversations = true

  if (deleteConfirmButton) {
    deleteConfirmButton.disabled = true
    deleteConfirmButton.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Suppression...</span>'
  }

  if (deleteSelectedConversationsButton) {
    deleteSelectedConversationsButton.disabled = true
  }

  if (deleteConversationsError) {
    deleteConversationsError.textContent = ''
    deleteConversationsError.classList.add('hidden')
  }

  const deletedIds = []
  const failedIds = []

  try {
    for (const conversationId of ids) {
      try {
        await api(`/conversations/${conversationId}`, {
          method: 'DELETE',
        })

        await unsubscribeFromConversation(conversationId)

        deletedIds.push(Number(conversationId))
      } catch (error) {
        if (error.message === 'SESSION_EXPIRED') {
          window.location.reload()
          return
        }

        failedIds.push(Number(conversationId))
      }
    }

    if (deletedIds.length) {
      state.conversations = state.conversations.filter(
        (conversation) =>
          !deletedIds.includes(Number(conversation.id))
      )

      deletedIds.forEach((id) => {
        selectedConversationIds.delete(id)
      })

      if (
        state.selectedConversationId !== null &&
        deletedIds.includes(Number(state.selectedConversationId))
      ) {
        state.selectedConversationId = null
        state.selectedRecipient = null
        state.currentMessages = []

        exitMessageSelectionMode()
        showConversationList()

        emptyChatState.classList.remove('hidden')
        chatContent.classList.add('hidden')
        chatContent.classList.remove('flex')
      }
    }

    if (failedIds.length) {
      state.pendingDeleteConversationIds = failedIds

      if (deleteConfirmTitle) {
        deleteConfirmTitle.textContent =
          'Suppression incomplète'
      }

      if (deleteConfirmMessage) {
        deleteConfirmMessage.textContent =
          `${deletedIds.length} conversation(s) supprimée(s). ${failedIds.length} conversation(s) n'ont pas pu être supprimées.`
      }

      if (deleteConversationsError) {
        deleteConversationsError.textContent =
          'Certaines conversations n’ont pas pu être supprimées. Tu peux réessayer ou annuler.'
        deleteConversationsError.classList.remove('hidden')
      }

      if (deleteConfirmButton) {
        deleteConfirmButton.innerHTML =
          '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Réessayer</span>'
      }
    } else {
      deleteConfirmModal?.classList.add('hidden')
      deleteConfirmModal?.classList.remove('flex')

      state.pendingDeleteConversationIds = []

      if (state.conversationSelectionMode) {
        exitConversationSelectionMode()
      }
    }

    closeConversationMenu()
    renderConversations()
    updateSelectionUI()
  } finally {
    state.deletingConversations = false

    if (deleteConfirmButton) {
      deleteConfirmButton.disabled = false

      if (
        !failedIds.length &&
        state.pendingDeleteConversationIds.length === 0
      ) {
        deleteConfirmButton.innerHTML =
          '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Supprimer</span>'
      }
    }

    updateSelectionUI()
  }
}

// ==================================================
// MESSAGES NON LUS
// ==================================================

export const countedUnreadMessageIds = new Set()

export function setUnreadCount(conversationId, count) {
  const conversation = getConversationById(conversationId)

  if (conversation) {
    conversation.unreadCount = count
  }

  const item = conversationList.querySelector(
    `.chat-item[data-conversation-id="${conversationId}"]`
  )

  if (!item) {
    return
  }

  item.dataset.unread = String(count)

  const badge = item.querySelector('[data-unread-badge]')

  if (badge) {
    badge.textContent = count > 99 ? '99+' : String(count)
    badge.classList.toggle('hidden', count === 0)
    badge.classList.toggle('flex', count > 0)
  }

  applyCurrentFilter()
}

export async function markConversationAsRead(conversationId) {
  setUnreadCount(conversationId, 0)

  try {
    await api(`/conversations/${conversationId}`)
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
    }
  }
}

// ==================================================
// FAVORIS
// ==================================================

function setFavoriteUI(conversationId, favorite) {
  const conversation = getConversationById(conversationId)

  if (conversation) {
    conversation.favorite = favorite
  }

  const item = conversationList.querySelector(
    `.chat-item[data-conversation-id="${conversationId}"]`
  )

  if (!item) {
    return
  }

  item.dataset.favorite = favorite ? 'true' : 'false'

  item
    .querySelector('[data-favorite-star]')
    ?.classList.toggle('hidden', !favorite)

  applyCurrentFilter()
}

async function toggleFavorite(conversationId) {
  const conversation = getConversationById(conversationId)

  if (!conversation) {
    return
  }

  const previous = Boolean(conversation.favorite)

  setFavoriteUI(conversationId, !previous)

  try {
    const result = await api(`/conversations/${conversationId}/favorite`, {
      method: 'PATCH',
    })

    setFavoriteUI(conversationId, Boolean(result?.data?.favorite))
  } catch (error) {
    setFavoriteUI(conversationId, previous)

    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
    }
  }
}

// ==================================================
// CRÉATION D'UNE CONVERSATION
// ==================================================

function createConversationElement(conversation) {
  const item = document.createElement('button')

  item.type = 'button'
  item.dataset.chatUser = String(conversation.id)
  item.dataset.conversationId = String(conversation.id)
  item.dataset.unread = String(Number(conversation.unreadCount || 0))

  item.dataset.chatType = conversation.groupId
    ? 'group'
    : 'private'

  item.dataset.favorite = conversation.favorite
    ? 'true'
    : 'false'

  item.setAttribute('aria-selected', 'false')

  item.className =
  'chat-item group relative flex w-full select-none items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50'

  const checkbox = document.createElement('input')

  checkbox.type = 'checkbox'
  checkbox.dataset.conversationCheckbox = String(conversation.id)

  checkbox.className =
    'conversation-checkbox hidden h-4 w-4 shrink-0 cursor-pointer accent-[#075e8d]'

  checkbox.checked = selectedConversationIds.has(
    Number(conversation.id)
  )

  checkbox.addEventListener('click', (event) => {
    event.stopPropagation()

    toggleConversationSelection(conversation.id)
  })

  const user = getConversationUser(conversation)

  const avatar = document.createElement('div')

    avatar.className =
    'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold ' +
    (conversation.groupId
      ? 'bg-[#29ff9d] text-[#075e8d]'
      : 'bg-[#075e8d] text-white')

  if (user?.avatar) {
    const img = document.createElement('img')

    img.src = user.avatar
    img.alt = ''
    img.className = 'h-full w-full object-cover'

    img.addEventListener(
      'error',
      () => {
        img.remove()
        avatar.textContent = getUserInitials(user)
      },
      { once: true }
    )

    avatar.appendChild(img)
  } else {
      avatar.textContent = user
      ? getUserInitials(user)
      : conversation.group
        ? getUserInitials({ fullName: conversation.group.name })
      : 'KC'
  }

  const details = document.createElement('div')
  details.className = 'min-w-0 flex-1'

  const top = document.createElement('div')
  top.className = 'flex items-start justify-between gap-2'

  const name = document.createElement('p')
  name.className =
    'truncate text-sm font-semibold text-brand-blue'
  name.textContent = getConversationName(conversation)

  const timeContainer = document.createElement('div')
  timeContainer.className =
    'relative flex shrink-0 flex-col items-end'

  const time = document.createElement('span')
  time.className = 'conversation-time text-xs text-slate-400'

  time.textContent = conversation.lastMessage
    ? formatTime(getMessageDateValue(conversation.lastMessage))
    : ''

  const actionsButton = document.createElement('button')

  actionsButton.type = 'button'
  actionsButton.dataset.conversationActions = String(conversation.id)

  actionsButton.setAttribute(
    'aria-label',
    'Options de la conversation'
  )

  actionsButton.title = 'Options de la conversation'

  actionsButton.className =
  'conversation-actions-button pointer-events-none absolute right-8 top-full z-10 flex h-5 w-5 items-center justify-center bg-transparent text-[#075e8d] opacity-0 transition md:pointer-events-auto md:focus:opacity-100 md:group-hover:opacity-100'

  const actionsIcon = document.createElement('i')
  actionsIcon.className = 'fa-solid fa-chevron-down text-[10px]'
  actionsIcon.setAttribute('aria-hidden', 'true')

  actionsButton.appendChild(actionsIcon)

  timeContainer.append(time, actionsButton)
  top.append(name, timeContainer)

  const preview = document.createElement('span')
  preview.className =
    'block truncate text-xs text-slate-500'

  preview.textContent = conversation.lastMessage
    ? getMessageText(conversation.lastMessage)
    : 'Aucun message'

  const unreadCount = Number(conversation.unreadCount || 0)

  const badge = document.createElement('span')
  badge.dataset.unreadBadge = ''
  badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount)
  badge.className =
    'h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#29ff9d] px-1.5 text-xs font-semibold text-[#075e8d] ' +
    (unreadCount > 0 ? 'flex' : 'hidden')

  const star = document.createElement('i')
  star.dataset.favoriteStar = ''
  star.setAttribute('aria-hidden', 'true')
  star.className =
    'fa-solid fa-star shrink-0 text-xs text-amber-400 ' +
    (conversation.favorite ? '' : 'hidden')

  preview.classList.add('min-w-0', 'flex-1')

  const bottom = document.createElement('div')
  bottom.className = 'flex items-center justify-between gap-2'
  bottom.append(preview, star, badge)

  details.append(top, bottom)
  item.append(checkbox, avatar, details)

      // ----- Appui prolongé (mobile) -----
  item.style.webkitTouchCallout = 'none'

  let longPressTimer = null
  let pressStartX = 0
  let pressStartY = 0

  const cancelLongPress = () => {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }

  item.addEventListener('pointerdown', (event) => {
    state.suppressNextConversationClick = false

    if (
      event.pointerType === 'mouse' ||
      state.conversationSelectionMode ||
      (event.target instanceof Element &&
        event.target.closest('[data-conversation-menu]'))
    ) {
      return
    }

    pressStartX = event.clientX
    pressStartY = event.clientY

    cancelLongPress()

    longPressTimer = setTimeout(() => {
      longPressTimer = null
      state.suppressNextConversationClick = true

      if (navigator.vibrate) {
        navigator.vibrate(30)
      }

      openConversationMenu(conversation.id, actionsButton)
    }, 500)
  })

  item.addEventListener('pointermove', (event) => {
    if (!longPressTimer) return

    if (
      Math.abs(event.clientX - pressStartX) > 10 ||
      Math.abs(event.clientY - pressStartY) > 10
    ) {
      cancelLongPress()
    }
  })

  ;['pointerup', 'pointercancel', 'pointerleave'].forEach((name) => {
    item.addEventListener(name, cancelLongPress)
  })

  // Empêche le menu natif du navigateur sur mobile
  item.addEventListener('contextmenu', (event) => {
    if (isMobile()) {
      event.preventDefault()
    }
  })

  return item
}

function sortConversations(conversationListData) {
  return [...conversationListData].sort((a, b) => {
    const dateA = a.lastMessage
      ? getMessageDateTimestamp(a.lastMessage)
      : 0

    const dateB = b.lastMessage
      ? getMessageDateTimestamp(b.lastMessage)
      : 0

    if (
      Number.isFinite(dateA) &&
      Number.isFinite(dateB) &&
      dateA !== dateB
    ) {
      return dateB - dateA
    }

    return Number(b.id || 0) - Number(a.id || 0)
  })
}

function renderConversations() {
  if (!chatItems) {
    return
  }

  chatItems.replaceChildren()

  state.conversations = sortConversations(state.conversations)

  state.conversations.forEach((conversation) => {
    chatItems.appendChild(createConversationElement(conversation))
  })

  applyCurrentFilter()
  updateSelectionUI()
}

export async function loadConversations(force = false) {
  if (state.conversationsLoading && !force) {
    return
  }

  state.conversationsLoading = true

  try {
    const result = await api('/conversations')
    const newConversations = getData(result)

    newConversations.forEach((conversation) => {
      const oldConversation = getConversationById(conversation.id)

      if (
        !conversation.lastMessage &&
        oldConversation?.lastMessage
      ) {
        conversation.lastMessage = oldConversation.lastMessage
      }
    })

    state.conversations = sortConversations(newConversations)

    const openConversation = getConversationById(state.selectedConversationId)

    if (openConversation) {
      openConversation.unreadCount = 0
    }

    const existingIds = new Set(
      state.conversations.map((conversation) => Number(conversation.id))
    )

    selectedConversationIds.forEach((id) => {
      if (!existingIds.has(id)) {
        selectedConversationIds.delete(id)
      }
    })

    renderConversations()

    const headerNameElement = $('#chatHeaderName')

    if (openConversation && headerNameElement) {
      headerNameElement.textContent = getConversationName(openConversation)
    }

    if (state.selectedConversationId !== null) {
      const selectedConversation = state.conversations.find(
        (conversation) =>
          Number(conversation.id) === Number(state.selectedConversationId)
      )

      if (!selectedConversation) {
        state.selectedConversationId = null
        state.selectedRecipient = null
        state.currentMessages = []

        exitMessageSelectionMode()
        showConversationList()
      }
    }
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
    }
  } finally {
    state.conversationsLoading = false
  }
}

// ==================================================
// APERÇU DE CONVERSATION
// ==================================================

export function updateConversationPreview(conversationId, message) {
  const conversation = getConversationById(conversationId)

  if (!conversation) {
    return
  }

  conversation.lastMessage = message

  const item = conversationList.querySelector(
    `.chat-item[data-conversation-id="${conversationId}"]`
  )

  if (!item) {
    renderConversations()
    return
  }

  const preview = item.querySelector('.block.truncate')
  const time = item.querySelector('.conversation-time')

  if (preview) {
    preview.textContent = message
      ? getMessageText(message)
      : 'Aucun message'
  }

  if (time) {
    time.textContent = message
      ? formatTime(getMessageDateValue(message))
      : ''
  }

  if (chatItems) {
    chatItems.prepend(item)
  }

  applyCurrentFilter()
}

export function updateLastMessageAfterDeletion(conversationId) {
  const conversation = getConversationById(conversationId)

  if (!conversation) {
    return
  }

  const remainingMessages = sortMessages(
    state.currentMessages.filter(
      (message) =>
        getMessageConversationId(message) ===
          Number(conversationId) ||
        !getMessageConversationId(message)
    )
  )

  const lastMessage =
    remainingMessages.length > 0
      ? remainingMessages[remainingMessages.length - 1]
      : null

  conversation.lastMessage = lastMessage

  updateConversationPreview(conversationId, lastMessage)
}

// ==================================================
// OUVERTURE D'UNE CONVERSATION
// ==================================================

export async function selectConversation(conversationId) {
  if (state.conversationSelectionMode) {
    toggleConversationSelection(conversationId)
    return
  }

  const conversation = getConversationById(conversationId)

  if (!conversation) return
  exitMessageSelectionMode()
  cancelEditingMessage()

  state.selectedConversationId = Number(conversation.id)
  state.selectedRecipient = null
  state.currentMessages = []

  conversationList
    .querySelectorAll('.chat-item')
    .forEach((item) => {
      const isActive =
        Number(item.dataset.conversationId) ===
        Number(conversation.id)

      item.classList.toggle('is-active', isActive)
      item.setAttribute('aria-selected', String(isActive))
    })

  const headerName = $('#chatHeaderName')
  const headerAvatar = $('#chatHeaderAvatar')
  const headerStatus = $('#chatHeaderStatus')

  const user = getConversationUser(conversation)

  if (headerName) {
    headerName.textContent = getConversationName(conversation)
    headerName.classList.toggle('cursor-pointer', Boolean(conversation.groupId))
  }

  if (headerAvatar) {
    if (user?.avatar) {
      headerAvatar.src = user.avatar
      headerAvatar.alt = getConversationName(conversation)
      headerAvatar.classList.remove('hidden')
    } else {
      headerAvatar.removeAttribute('src')
      headerAvatar.alt = ''
      headerAvatar.classList.add('hidden')
    }
  }

  if (headerStatus) {
    headerStatus.textContent = 'Disponible'
  }

  emptyChatState.classList.add('hidden')
  chatContent.classList.remove('hidden')
  chatContent.classList.add('flex')

  messageList.replaceChildren()

  showChatPanel()
  loadMessages(conversation.id)
  markConversationAsRead(conversation.id)
  subscribeToConversation(conversation.id)

  messageInput.focus()
}

function startConversationWithUser(user) {
  if (!user) {
    return
  }

  closeNewChatModal()
  exitMessageSelectionMode()
  cancelEditingMessage()

  state.selectedConversationId = null
  state.selectedRecipient = user
  state.currentMessages = []

  conversationList
    .querySelectorAll('.chat-item')
    .forEach((item) => {
      item.classList.remove('is-active')
      item.setAttribute('aria-selected', 'false')
    })

  const headerName = $('#chatHeaderName')
  const headerAvatar = $('#chatHeaderAvatar')
  const headerStatus = $('#chatHeaderStatus')

  if (headerName) {
    headerName.textContent =
      user.fullName || user.username || 'Utilisateur'
  }

  if (headerAvatar) {
    if (user.avatar) {
      headerAvatar.src = user.avatar
      headerAvatar.alt = user.fullName || user.username || ''
      headerAvatar.classList.remove('hidden')
    } else {
      headerAvatar.removeAttribute('src')
      headerAvatar.alt = ''
      headerAvatar.classList.add('hidden')
    }
  }

  if (headerStatus) {
    headerStatus.textContent = 'Nouvelle conversation'
  }

  emptyChatState.classList.add('hidden')
  chatContent.classList.remove('hidden')
  chatContent.classList.add('flex')

  messageList.replaceChildren()
  showChatPanel()

  requestAnimationFrame(() => {
    messageInput.focus()
  })
}


export function openChatWithUser(user) {
  const existing = state.conversations.find((conversation) => {
    if (conversation.groupId) {
      return false
    }

    const peer = getConversationUser(conversation)

    return peer && Number(peer.id) === Number(user.id)
  })

  if (existing) {
    closeNewChatModal()
    selectConversation(existing.id)
    return
  }

  startConversationWithUser(user)
}

// ==================================================
// FILTRES
// ==================================================

function applyCurrentFilter() {
  const activeFilter =
    $('[data-chat-filter].is-active')?.dataset.chatFilter ||
    'all'

  conversationList
    .querySelectorAll('.chat-item')
    .forEach((item) => {
      const unread = Number(item.dataset.unread || 0) > 0
      const group = item.dataset.chatType === 'group'
      const favorite = item.dataset.favorite === 'true'

      const matches =
        activeFilter === 'all' ||
        (activeFilter === 'unread' && unread) ||
        (activeFilter === 'groups' && group) ||
        (activeFilter === 'favorites' && favorite)

      item.classList.toggle('hidden', !matches)
    })
}

// ==================================================
// NAVIGATION ACTIVE
// ==================================================

export function setActiveNavigation(section) {
  document
    .querySelectorAll('[data-section]')
    .forEach((button) => {
      const isActive = button.dataset.section === section

      const isMobileNav =
        button.classList.contains('mobile-nav-item')

      const isDesktopNav =
        button.classList.contains('nav-item')

      if (!isMobileNav && !isDesktopNav) {
        return
      }

      button.classList.toggle('is-active', isActive)
      button.classList.toggle('bg-[#29ff9d]', isActive)
      button.classList.toggle('text-[#075e8d]', isActive)
      button.classList.toggle('bg-transparent', !isActive)
      button.classList.toggle('hover:bg-[#29ff9d]', isActive)
      button.classList.toggle('hover:bg-transparent', !isActive)

      button.setAttribute(
        'aria-current',
        isActive ? 'page' : 'false'
      )
    })
}

// Branche les écouteurs d'événements de cette fonctionnalité
export function setupConversations() {
  cancelConversationSelection?.addEventListener(
    'click',
    exitConversationSelectionMode
  )

  closeDeleteConfirmButton?.addEventListener(
    'click',
    closeDeleteConfirmation
  )

  cancelDeleteConfirmButton?.addEventListener(
    'click',
    closeDeleteConfirmation
  )

  deleteConfirmModal?.addEventListener('click', (event) => {
    if (event.target === deleteConfirmModal) {
      closeDeleteConfirmation()
    }
  })

  deleteConfirmButton?.addEventListener(
    'click',
    confirmDeleteConversations
  )

  newChatContacts?.addEventListener('click', (event) => {
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

    if (
      !user ||
      Number(user.id) === Number(getCurrentUserId())
    ) {
      return
    }

    openChatWithUser(user)
  })

  // ==================================================
  // CLICS SUR LES CONVERSATIONS
  // ==================================================

  conversationList.addEventListener('click', (event) => {
    const target = event.target

    if (!(target instanceof Element)) {
      return
    }

    if (state.suppressNextConversationClick) {
      state.suppressNextConversationClick = false
      event.stopPropagation()
      return
    }

    const checkbox = target.closest(
      '[data-conversation-checkbox]'
    )

    if (checkbox && conversationList.contains(checkbox)) {
      event.stopPropagation()
      return
    }

    const actionsButton = target.closest(
      '[data-conversation-actions]'
    )

    if (actionsButton && conversationList.contains(actionsButton)) {
      event.stopPropagation()

      const conversationId = Number(
        actionsButton.dataset.conversationActions
      )

      if (!Number.isInteger(conversationId) || conversationId <= 0) {
        return
      }

      if (state.openConversationMenuId === conversationId) {
        closeConversationMenu()
      } else {
        openConversationMenu(conversationId, actionsButton)
      }

      return
    }

    const menuAction = target.closest(
      '[data-conversation-menu-action]'
    )

    if (menuAction && conversationList.contains(menuAction)) {
      event.stopPropagation()

      const action = menuAction.dataset.conversationMenuAction
      const conversationId = Number(menuAction.dataset.conversationId)

      closeConversationMenu()
      
      if (action === 'favorite') {
        toggleFavorite(conversationId)
        return
      }

      if (action === 'delete') {
        showDeleteConfirmation([conversationId])
        return
      }

      if (action === 'select') {
        enterConversationSelectionMode()
        return
      }
    }

    const item = target.closest(
      '.chat-item[data-conversation-id]'
    )

    if (!item) {
      return
    }

    const conversationId = Number(item.dataset.conversationId)

    if (state.conversationSelectionMode) {
      toggleConversationSelection(conversationId)
      return
    }

    selectConversation(conversationId)
  })

  deleteSelectedConversationsButton?.addEventListener(
    'click',
    () => {
      showDeleteConfirmation(getSelectedConversationIds())
    }
  )

  // ==================================================
  // RECHERCHE DES CONVERSATIONS
  // ==================================================

  chatSearch?.addEventListener('input', () => {
    const query = chatSearch.value.trim().toLowerCase()

    conversationList
      .querySelectorAll('.chat-item')
      .forEach((item) => {
        item.classList.toggle(
          'hidden',
          !item.textContent.toLowerCase().includes(query)
        )
      })
  })

  document
    .querySelectorAll('[data-chat-filter]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        document
          .querySelectorAll('[data-chat-filter]')
          .forEach((other) => {
            other.classList.remove('is-active')
            other.setAttribute('aria-pressed', 'false')
          })

        button.classList.add('is-active')
        button.setAttribute('aria-pressed', 'true')

        applyCurrentFilter()
      })
    })

  // ==================================================
  // NAVIGATION
  // ==================================================

  mobileBackToChats?.addEventListener(
    'click',
    showConversationList
  )

  document
    .querySelectorAll('[data-section="chats"]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        hideMessageActions()

        if (isMobile()) {
          showConversationList()
        } else if (
          state.selectedConversationId === null &&
          !state.selectedRecipient
        ) {
          emptyChatState.classList.remove('hidden')
          chatContent.classList.add('hidden')
          chatContent.classList.remove('flex')
        }
      })
    })

  // ==================================================
  // FERMETURE DES MENUS AU CLIC EXTÉRIEUR
  // ==================================================

  document.addEventListener('click', (event) => {
    const target = event.target

    if (!(target instanceof Element)) {
      return
    }

    if (
      !target.closest('[data-conversation-actions]') &&
      !target.closest('[data-conversation-menu]')
    ) {
      closeConversationMenu()
    }

    if (
      !target.closest('[data-message-options]') &&
      !target.closest('[data-message-menu]')
    ) {
      closeMessageMenu()
    }
  })

  // ==================================================
  // ÉCHAP POUR FERMER LES MODALES
  // ==================================================

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return
    }

    if (
      deleteConfirmModal &&
      !deleteConfirmModal.classList.contains('hidden')
    ) {
      closeDeleteConfirmation()
      return
    }

    if (
      deleteMessagesConfirmModal &&
      !deleteMessagesConfirmModal.classList.contains('hidden')
    ) {
      closeDeleteMessagesConfirmation()
      return
    }

    if (state.editingMessageId !== null) {
      cancelEditingMessage()
      return
    }

    closeConversationMenu()
    closeMessageMenu()
  })

  // ==================================================
  // REDIMENSIONNEMENT
  // ==================================================

  window.addEventListener('resize', () => {
    hideMessageActions()

    if (isMobile()) {
      if (
        state.selectedConversationId !== null ||
        state.selectedRecipient
      ) {
        showChatPanel()
      } else {
        showConversationList()
      }
    } else {
      conversationList.classList.remove('hidden')
      mainPanel.classList.remove('hidden')
      mainPanel.classList.add('flex')
      mobileNavigation?.classList.remove('hidden')
    }
  })

  document
    .querySelectorAll('[data-section]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        setActiveNavigation(button.dataset.section)
      })
    })

}
