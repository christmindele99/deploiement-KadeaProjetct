import { loadConversations, updateConversationPreview, updateLastMessageAfterDeletion } from './conversations.js'
import { handleMessageUpdated, subscribeToConversation } from './realtime.js'
import { cancelDeleteMessages, cancelMessageSelection, closeDeleteMessagesConfirm, confirmDeleteMessages, deleteMessagesConfirmMessage, deleteMessagesConfirmModal, deleteMessagesConfirmTitle, deleteMessagesError, deleteSelectedMessagesButton, messageForm, messageInput, messageList, messageSelectionCount, messageSelectionHeader, selectedMessageIds, state } from './state.js'
import { api, formatDate, formatTime, getConversationUser, getData, getMessageDateValue, getMessageId, getMessageText, hasMessage, isMobile, isMyMessage, sortMessages, upsertMessage } from './utils.js'

// ==================================================
// MENU D'ACTIONS DES MESSAGES
// ==================================================

export function closeMessageMenu() {
  state.openMessageMenuId = null

  messageList
    .querySelectorAll('[data-message-menu]')
    .forEach((menu) => menu.remove())
}

export function hideMessageActions() {
  closeMessageMenu()

  messageList
    .querySelectorAll('[data-message-row]')
    .forEach((row) => {
      row.classList.remove('message-selected')
    })
}

function createMessageMenu(messageId) {
  const menu = document.createElement('div')

  menu.dataset.messageMenu = String(messageId)

  menu.className =
    'absolute z-50 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg'

  menu.style.top = '100%'

  const row = messageList.querySelector(
    `[data-message-row][data-message-id="${messageId}"]`
  )

  const mine = row?.dataset.messageSender === 'me'

  if (mine) {
    menu.style.right = '0'
  } else {
    menu.style.left = '0'
  }

  // Supprimer le message.
  const deleteButton = document.createElement('button')

  deleteButton.type = 'button'
  deleteButton.dataset.messageMenuAction = 'delete'
  deleteButton.dataset.messageId = String(messageId)

  deleteButton.className =
    'flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-red-50 hover:text-red-600'

  const deleteIcon = document.createElement('i')
  deleteIcon.className =
    'fa-solid fa-trash-can w-5 text-center text-red-500'

  const deleteText = document.createElement('span')
  deleteText.textContent = 'Supprimer le message'

  deleteButton.append(deleteIcon, deleteText)

  // Sélectionner les messages.
  const selectButton = document.createElement('button')

  selectButton.type = 'button'
  selectButton.dataset.messageMenuAction = 'select'
  selectButton.dataset.messageId = String(messageId)

  selectButton.className =
    'flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-[#075e8d]'

  const selectIcon = document.createElement('i')
  selectIcon.className =
    'fa-solid fa-check w-5 text-center text-[#075e8d]'

  const selectText = document.createElement('span')
  selectText.textContent = 'Sélectionner les messages'

  selectButton.append(selectIcon, selectText)

  // Annuler et fermer le menu.
  const cancelButton = document.createElement('button')

  cancelButton.type = 'button'
  cancelButton.dataset.messageMenuAction = 'cancel'

  cancelButton.className =
    'flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50'

  const cancelIcon = document.createElement('i')
  cancelIcon.className =
    'fa-solid fa-xmark w-5 text-center text-slate-400'

  const cancelText = document.createElement('span')
  cancelText.textContent = 'Annuler'

  cancelButton.append(cancelIcon, cancelText)

  menu.append(deleteButton, selectButton)

  // Modifier le message (seulement pour mes propres messages)
  const messageData = state.currentMessages.find(
    (item) => getMessageId(item) === Number(messageId)
  )

  if (mine && messageData && !messageData.deletedAt) {
    const editButton = document.createElement('button')

    editButton.type = 'button'
    editButton.dataset.messageMenuAction = 'edit'
    editButton.dataset.messageId = String(messageId)

    editButton.className =
      'flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-[#075e8d]'

    const editIcon = document.createElement('i')
    editIcon.className =
      'fa-solid fa-pen w-5 text-center text-[#075e8d]'

    const editText = document.createElement('span')
    editText.textContent = 'Modifier le message'

    editButton.append(editIcon, editText)
    menu.append(editButton)
  }

  menu.append(cancelButton)

  return menu
}

function openMessageMenu(messageId, actionsButton) {
  if (state.messageSelectionMode) {
    return
  }

  closeMessageMenu()

  const row = actionsButton.closest('[data-message-row]')

  if (!row) {
    return
  }

  const menu = createMessageMenu(messageId)

  row.appendChild(menu)

  state.openMessageMenuId = Number(messageId)
}

// ==================================================
// SÉLECTION MULTIPLE DES MESSAGES
// ==================================================

function updateMessageSelectionUI() {
  messageList
    .querySelectorAll('[data-message-row]')
    .forEach((row) => {
      const messageId = Number(row.dataset.messageId)

      // La case à cocher se trouve dans le conteneur
      // extérieur de la bulle, pas dans la bulle elle-même.
      const checkbox = row.parentElement?.querySelector(
        '[data-message-checkbox]'
      )

      const actionsButton = row.querySelector(
        '[data-message-options]'
      )

      const isSelected = selectedMessageIds.has(messageId)

      if (checkbox) {
        checkbox.checked = isSelected
        checkbox.classList.toggle(
          'hidden',
          !state.messageSelectionMode
        )
      }

      row.classList.toggle(
        'message-selected',
        state.messageSelectionMode && isSelected
      )

      if (actionsButton) {
        actionsButton.style.display = state.messageSelectionMode ? 'none' : 'flex'
      }
    })

  if (messageSelectionHeader) {
    messageSelectionHeader.classList.toggle(
      'hidden',
      !state.messageSelectionMode
    )

    messageSelectionHeader.classList.toggle(
      'flex',
      state.messageSelectionMode
    )
  }

  if (messageSelectionCount) {
    messageSelectionCount.textContent = String(
      selectedMessageIds.size
    )
  }

  if (deleteSelectedMessagesButton) {
    deleteSelectedMessagesButton.disabled =
      selectedMessageIds.size === 0 ||
      state.deletingMessages
  }
}

function enterMessageSelectionMode(initialMessageId = null) {
  closeMessageMenu()

  state.messageSelectionMode = true
  selectedMessageIds.clear()

  if (
    initialMessageId !== null &&
    hasMessage(initialMessageId)
  ) {
    selectedMessageIds.add(Number(initialMessageId))
  }

  updateMessageSelectionUI()
}

export function exitMessageSelectionMode() {
  state.messageSelectionMode = false
  selectedMessageIds.clear()

  closeMessageMenu()
  updateMessageSelectionUI()
}

function toggleMessageSelection(messageId) {
  const id = Number(messageId)

  if (!Number.isFinite(id) || id <= 0) {
    return
  }

  if (selectedMessageIds.has(id)) {
    selectedMessageIds.delete(id)
  } else {
    selectedMessageIds.add(id)
  }

  updateMessageSelectionUI()
}

function getSelectedMessageIds() {
  return Array.from(selectedMessageIds)
}

// Texte d'origine du champ de saisie (lu au démarrage dans setupMessages)
let defaultMessagePlaceholder = ''

function setEditingUI(isEditing) {
  messageInput.placeholder = isEditing
    ? 'Modifier le message...'
    : defaultMessagePlaceholder

  const sendIcon = messageForm.querySelector('button[type="submit"] i')

  sendIcon?.classList.toggle('fa-paper-plane', !isEditing)
  sendIcon?.classList.toggle('fa-check', isEditing)
}

// ==================================================
// MODIFICATION D'UN MESSAGE
// ==================================================

function startEditingMessage(messageId) {
  const message = state.currentMessages.find(
    (item) => getMessageId(item) === Number(messageId)
  )

  if (!message || message.deletedAt || !isMyMessage(message)) {
    return
  }

  closeMessageMenu()

  state.editingMessageId = getMessageId(message)
  setEditingUI(true)

  messageInput.value = message.content ?? ''
  messageInput.focus()

  messageInput.setSelectionRange(
    messageInput.value.length,
    messageInput.value.length
  )
}

export function cancelEditingMessage() {
  if (state.editingMessageId === null) {
    return
  }

  state.editingMessageId = null
  messageInput.value = ''
  setEditingUI(false)
}

async function submitMessageEdit(content) {
  const messageId = state.editingMessageId

  const original = state.currentMessages.find(
    (item) => getMessageId(item) === messageId
  )

  // Rien n'a changé : on quitte simplement le mode édition
  if (!original || original.content === content) {
    cancelEditingMessage()
    return
  }

  state.sendingMessage = true
  messageInput.disabled = true

  try {
    const result = await api(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    })

    const updated = result?.data

    if (updated?.id) {
      handleMessageUpdated(updated)
    }

    cancelEditingMessage()
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
    }

    // Sinon on reste en mode édition : le texte est conservé pour réessayer
  } finally {
    state.sendingMessage = false
    messageInput.disabled = false
    messageInput.focus()
  }
}

// ==================================================
// MESSAGES : MENU, CASES À COCHER ET BULLES
// ==================================================

function createMessageBubble(message, index) {
  const mine = isMyMessage(message)
  const messageId = getMessageId(message)

  const wrapper = document.createElement('div')
  
wrapper.style.cssText =
  'position:relative;display:flex;flex-direction:column;' +
  'width:fit-content;max-width:70%;min-width:0;' +
  `align-items:${mine ? 'flex-end' : 'flex-start'};`


  wrapper.dataset.messageRow = ''
  wrapper.dataset.messageIndex = String(index)
  wrapper.dataset.messageId = String(messageId)
  wrapper.dataset.messageSender = mine ? 'me' : 'them'

  wrapper.className =
  'group max-md:select-none [-webkit-touch-callout:none]'

  const bubble = document.createElement('div')

  bubble.style.cssText =
  'box-sizing:border-box;width:fit-content;max-width:100%;' +
  'padding:12px 16px;overflow-wrap:anywhere;word-break:break-word;' +
    'box-shadow:0 1px 3px rgba(0,0,0,.08);' +
    (
      mine
        ? 'background:#075e8d;color:#fff;border-radius:16px 0 16px 16px;'
        : 'background:#f1f5f9;color:#075e8d;border-radius:0 16px 16px 16px;'
    )

  const text = document.createElement('p')

  text.style.cssText =
    'margin:0;padding:0;font-size:14px;line-height:1.6;' +
    'white-space:pre-wrap;overflow-wrap:anywhere;' +
    `color:${mine ? '#fff' : '#075e8d'};`

  text.textContent = getMessageText(message)

      const isDeleted = Boolean(message.deletedAt)

  if (isDeleted) {
    text.style.fontStyle = 'italic'
    text.style.opacity = '0.7'
  }

  // Pied de la bulle : flèche à gauche, heure à droite.
  const footer = document.createElement('div')

  footer.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;' +
    'gap:12px;width:100%;min-height:22px;margin-top:8px;'

  // Flèche du menu d'actions.
  const actionsButton = document.createElement('button')

  actionsButton.type = 'button'
  actionsButton.dataset.messageOptions = String(messageId)

  actionsButton.setAttribute(
    'aria-label',
    'Options du message'
  )

  actionsButton.title = 'Options du message'

  actionsButton.className =
  'pointer-events-none flex h-6 w-6 shrink-0 items-center justify-center bg-transparent opacity-0 transition md:pointer-events-auto md:focus:opacity-100 md:group-hover:opacity-100 ' +
  (mine ? 'text-white' : 'text-[#075e8d]')

  const actionsIcon = document.createElement('i')
  actionsIcon.className = 'fa-solid fa-chevron-down text-xs'
  actionsIcon.setAttribute('aria-hidden', 'true')

  actionsButton.appendChild(actionsIcon)

  // Heure et indicateur de modification.
  const time = document.createElement('span')

  time.style.cssText =
    'display:flex;align-items:center;justify-content:flex-end;' +
    'flex-wrap:wrap;gap:4px;margin:0;font-size:10px;' +
    'text-align:right;min-width:0;'

  time.style.color = mine
    ? 'rgba(255,255,255,.75)'
    : '#64748b'

  time.appendChild(
    document.createTextNode(
      formatTime(getMessageDateValue(message))
    )
  )

  if (message.editedAt || message.edited) {
    const edited = document.createElement('span')

    edited.className = 'text-xs opacity-70'
    edited.textContent = 'Modifié'

    time.appendChild(edited)
  }

    if (isDeleted && !mine) {
      footer.style.justifyContent = 'flex-end'
      footer.append(time)
    } else {
      footer.append(actionsButton, time)
    }
  bubble.append(text, footer)

  // Case à cocher pour la sélection multiple.
  const checkbox = document.createElement('input')

  checkbox.type = 'checkbox'
  checkbox.dataset.messageCheckbox = String(messageId)

  checkbox.setAttribute(
    'aria-label',
    `Sélectionner le message ${messageId}`
  )

  checkbox.className =
    'message-checkbox hidden h-4 w-4 shrink-0 cursor-pointer accent-[#075e8d]'

  checkbox.checked = selectedMessageIds.has(messageId)

      // ----- Appui prolongé (mobile) -----
  let longPressTimer = null
  let pressStartX = 0
  let pressStartY = 0

  const cancelLongPress = () => {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }

  wrapper.addEventListener('pointerdown', (event) => {
    state.suppressNextMessageClick = false

    if (
      event.pointerType === 'mouse' ||
      state.messageSelectionMode ||
      (isDeleted && !mine) ||
      (event.target instanceof Element &&
        event.target.closest('[data-message-menu]'))
    ) {
      return
    }

    pressStartX = event.clientX
    pressStartY = event.clientY

    cancelLongPress()

    longPressTimer = setTimeout(() => {
      longPressTimer = null
      state.suppressNextMessageClick = true

      if (navigator.vibrate) {
        navigator.vibrate(30)
      }

      openMessageMenu(messageId, wrapper)
    }, 500)
  })

  wrapper.addEventListener('pointermove', (event) => {
    if (!longPressTimer) return

    if (
      Math.abs(event.clientX - pressStartX) > 10 ||
      Math.abs(event.clientY - pressStartY) > 10
    ) {
      cancelLongPress()
    }
  })

  ;['pointerup', 'pointercancel', 'pointerleave'].forEach((name) => {
    wrapper.addEventListener(name, cancelLongPress)
  })

  // Empêche le menu natif du navigateur sur mobile
  wrapper.addEventListener('contextmenu', (event) => {
    if (isMobile()) {
      event.preventDefault()
    }
  })

  wrapper.appendChild(bubble)

  return {
    wrapper,
    checkbox,
  }
}

export function renderMessages(shouldScroll = true) {
  hideMessageActions()

  state.currentMessages = sortMessages(state.currentMessages)

  // Supprime de la sélection les messages qui n'existent plus.
  const currentIds = new Set(
    state.currentMessages.map((message) => getMessageId(message))
  )

  selectedMessageIds.forEach((id) => {
    if (!currentIds.has(id)) {
      selectedMessageIds.delete(id)
    }
  })

  messageList.replaceChildren()

  let lastDate = null

  state.currentMessages.forEach((message, index) => {
    const dateLabel = formatDate(getMessageDateValue(message))

    if (dateLabel && dateLabel !== lastDate) {
      lastDate = dateLabel

      const dateRow = document.createElement('div')

      dateRow.style.cssText =
        'display:flex;justify-content:center;width:100%;margin:12px 0;'

      const dateSpan = document.createElement('span')

      dateSpan.className =
        'rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm'

      dateSpan.textContent = dateLabel
      dateRow.appendChild(dateSpan)
      messageList.appendChild(dateRow)
    }

    const row = document.createElement('div')

    row.style.cssText =
      'display:flex;width:100%;min-width:0;align-items:center;gap:10px;' +
      `justify-content:${isMyMessage(message) ? 'flex-end' : 'flex-start'};`

    const { wrapper, checkbox } = createMessageBubble(
      message,
      index
    )

    checkbox.addEventListener('click', (event) => {
      event.stopPropagation()
      toggleMessageSelection(checkbox.dataset.messageCheckbox)
    })

    // La case reste à l'extérieur de la bulle.
    if (isMyMessage(message)) {
      row.append(checkbox, wrapper)
    } else {
      row.append(wrapper, checkbox)
    }

    messageList.appendChild(row)
  })

  updateMessageSelectionUI()

  if (shouldScroll) {
    requestAnimationFrame(() => {
      messageList.scrollTop = messageList.scrollHeight
    })
  }
}

// ==================================================
// CHARGEMENT DES MESSAGES
// ==================================================

export async function loadMessages(conversationId) {
  if (!conversationId || state.messagesLoading) {
    return
  }

  state.messagesLoading = true

  const requestedConversationId = Number(conversationId)

  try {
    const result = await api(
      `/conversations/${requestedConversationId}/messages`
    )

    if (
      Number(state.selectedConversationId) !==
      requestedConversationId
    ) {
      return
    }

    state.currentMessages = sortMessages(getData(result))

    selectedMessageIds.clear()
    exitMessageSelectionMode()

    renderMessages(true)
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
    }
  } finally {
    state.messagesLoading = false
  }
}

// ==================================================
// ENVOI DE MESSAGE
// ==================================================

async function sendMessage() {
      if (state.sendingMessage) {
    return
  }

  const content = messageInput.value.trim()

  // En mode modification : champ vide + envoyer = annuler la modification
  if (state.editingMessageId !== null) {
    if (!content) {
      cancelEditingMessage()
      return
    }

    await submitMessageEdit(content)
    return
  }

  if (!content) {
    return
  }

  if (
    state.selectedConversationId === null &&
    !state.selectedRecipient
  ) {
    return
  }

  state.sendingMessage = true
  messageInput.disabled = true

  try {
    let result

    if (state.selectedConversationId === null) {
      result = await api('/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: state.selectedRecipient.id,
          content,
        }),
      })
    } else {
      result = await api(
        `/conversations/${state.selectedConversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content }),
        }
      )
    }

    const message = result?.data ?? result

    if (!message?.id) {
      throw new Error('INVALID_MESSAGE_RESPONSE')
    }

    messageInput.value = ''

    if (state.selectedConversationId === null) {
      const peerId = Number(state.selectedRecipient.id)

      await loadConversations(true)

      const createdConversation = state.conversations.find(
        (conversation) => {
          if (conversation.groupId) {
            return false
          }

          const peer = getConversationUser(conversation)

          return peer && Number(peer.id) === peerId
        }
      )

      if (!createdConversation) {
        return
      }

      state.selectedConversationId = Number(createdConversation.id)
      state.selectedRecipient = null
      state.currentMessages = [message]

      renderMessages(true)

      updateConversationPreview(state.selectedConversationId, message)

      await subscribeToConversation(state.selectedConversationId)
    } else {
      upsertMessage(message, true)
      updateConversationPreview(state.selectedConversationId, message)
    }
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
    }
  } finally {
    state.sendingMessage = false
    messageInput.disabled = false
    messageInput.focus()
  }
}

// ==================================================
// MODALE DE CONFIRMATION DE SUPPRESSION DES MESSAGES
// ==================================================

function showDeleteMessagesConfirmation(ids) {
  if (
    !deleteMessagesConfirmModal ||
    !deleteMessagesConfirmTitle ||
    !deleteMessagesConfirmMessage ||
    !confirmDeleteMessages
  ) {
    return
  }

  const validIds = [
    ...new Set(
      ids
        .map(Number)
        .filter((id) => Number.isFinite(id) && id > 0)
    ),
  ].filter((id) => hasMessage(id))

  if (!validIds.length || state.deletingMessages) {
    return
  }

  state.pendingDeleteMessageIds = validIds

  if (deleteMessagesError) {
    deleteMessagesError.textContent = ''
    deleteMessagesError.classList.add('hidden')
  }

  if (validIds.length === 1) {
    deleteMessagesConfirmTitle.textContent =
      'Supprimer le message'

    deleteMessagesConfirmMessage.textContent =
      'Veux-tu vraiment supprimer ce message ? Cette action est irréversible.'
  } else {
    deleteMessagesConfirmTitle.textContent =
      'Supprimer les messages'

    deleteMessagesConfirmMessage.textContent =
      `Veux-tu vraiment supprimer les ${validIds.length} messages sélectionnés ? Cette action est irréversible.`
  }

  confirmDeleteMessages.disabled = false
  confirmDeleteMessages.innerHTML =
    '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Supprimer</span>'

  deleteMessagesConfirmModal.classList.remove('hidden')
  deleteMessagesConfirmModal.classList.add('flex')
}

export function closeDeleteMessagesConfirmation() {
  if (
    !deleteMessagesConfirmModal ||
    state.deletingMessages
  ) {
    return
  }

  deleteMessagesConfirmModal.classList.add('hidden')
  deleteMessagesConfirmModal.classList.remove('flex')

  state.pendingDeleteMessageIds = []

  if (deleteMessagesError) {
    deleteMessagesError.textContent = ''
    deleteMessagesError.classList.add('hidden')
  }
}

// ==================================================
// SUPPRESSION DES MESSAGES
// ==================================================

async function confirmDeleteMessagesAction() {
  if (
    state.deletingMessages ||
    !state.pendingDeleteMessageIds.length
  ) {
    return
  }

  const ids = [...state.pendingDeleteMessageIds]

    const alreadyDeletedIds = new Set(
    ids
      .map(Number)
      .filter((id) =>
        state.currentMessages.some(
          (message) => getMessageId(message) === id && message.deletedAt
        )
      )
  )

  state.deletingMessages = true

  if (confirmDeleteMessages) {
    confirmDeleteMessages.disabled = true
    confirmDeleteMessages.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Suppression...</span>'
  }

  if (deleteSelectedMessagesButton) {
    deleteSelectedMessagesButton.disabled = true
  }

  if (deleteMessagesError) {
    deleteMessagesError.textContent = ''
    deleteMessagesError.classList.add('hidden')
  }

  const deletedIds = []
  const failedIds = []

  try {
    for (const messageId of ids) {
      const message = state.currentMessages.find(
        (item) => getMessageId(item) === Number(messageId)
      )

      if (!message) {
        deletedIds.push(Number(messageId))
        continue
      }

      // Le serveur reste responsable de vérifier les droits.
      try {
        await api(`/messages/${messageId}`, {
          method: 'DELETE',
        })

        deletedIds.push(Number(messageId))
      } catch (error) {
        if (error.message === 'SESSION_EXPIRED') {
          window.location.reload()
          return
        }

        failedIds.push(Number(messageId))
      }
    }

    if (deletedIds.length) {
        state.currentMessages = state.currentMessages.filter(
          (message) =>
            !(
              deletedIds.includes(getMessageId(message)) &&
              alreadyDeletedIds.has(getMessageId(message))
            )
        )
        .map((message) =>
          deletedIds.includes(getMessageId(message))
            ? { ...message, content: null, deletedAt: new Date().toISOString() }
            : message
        )

      deletedIds.forEach((id) => {
        selectedMessageIds.delete(id)
      })

      renderMessages(true)

      if (state.selectedConversationId !== null) {
        updateLastMessageAfterDeletion(
          state.selectedConversationId
        )
      }
    }

    if (failedIds.length) {
      state.pendingDeleteMessageIds = failedIds

      if (deleteMessagesConfirmTitle) {
        deleteMessagesConfirmTitle.textContent =
          'Suppression incomplète'
      }

      if (deleteMessagesConfirmMessage) {
        deleteMessagesConfirmMessage.textContent =
          `${deletedIds.length} message(s) supprimé(s). ${failedIds.length} message(s) n'ont pas pu être supprimés.`
      }

      if (deleteMessagesError) {
        deleteMessagesError.textContent =
          'Certains messages n’ont pas pu être supprimés. Vérifie tes autorisations ou réessaie.'
        deleteMessagesError.classList.remove('hidden')
      }

      if (confirmDeleteMessages) {
        confirmDeleteMessages.innerHTML =
          '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Réessayer</span>'
      }
    } else {
      deleteMessagesConfirmModal?.classList.add('hidden')
      deleteMessagesConfirmModal?.classList.remove('flex')

      state.pendingDeleteMessageIds = []

      exitMessageSelectionMode()
    }

    updateMessageSelectionUI()
  } finally {
    state.deletingMessages = false

    if (confirmDeleteMessages) {
      confirmDeleteMessages.disabled = false

      if (
        !failedIds.length &&
        state.pendingDeleteMessageIds.length === 0
      ) {
        confirmDeleteMessages.innerHTML =
          '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Supprimer</span>'
      }
    }

    updateMessageSelectionUI()
  }
}

// Branche les écouteurs d'événements de cette fonctionnalité
export function setupMessages() {
  defaultMessagePlaceholder = messageInput?.placeholder


  cancelMessageSelection?.addEventListener(
    'click',
    exitMessageSelectionMode
  )

  messageForm.addEventListener('submit', (event) => {
    event.preventDefault()
    sendMessage()
  })

  closeDeleteMessagesConfirm?.addEventListener(
    'click',
    closeDeleteMessagesConfirmation
  )

  cancelDeleteMessages?.addEventListener(
    'click',
    closeDeleteMessagesConfirmation
  )

  deleteMessagesConfirmModal?.addEventListener(
    'click',
    (event) => {
      if (event.target === deleteMessagesConfirmModal) {
        closeDeleteMessagesConfirmation()
      }
    }
  )

  confirmDeleteMessages?.addEventListener(
    'click',
    confirmDeleteMessagesAction
  )

  deleteSelectedMessagesButton?.addEventListener(
    'click',
    () => {
      showDeleteMessagesConfirmation(
        getSelectedMessageIds()
      )
    }
  )

  // ==================================================
  // CLICS SUR LES MESSAGES
  // ==================================================

  messageList.addEventListener('click', (event) => {
    const target = event.target

    if (!(target instanceof Element)) {
      return
    }

    if (state.suppressNextMessageClick) {
      state.suppressNextMessageClick = false
      event.stopPropagation()
      return
    }

    // Case à cocher d'un message.
    const checkbox = target.closest(
      '[data-message-checkbox]'
    )

    if (checkbox && messageList.contains(checkbox)) {
      event.stopPropagation()

      toggleMessageSelection(
        checkbox.dataset.messageCheckbox
      )

      return
    }

    // Flèche du menu d'un message.
    const actionsButton = target.closest(
      '[data-message-options]'
    )

    if (
      actionsButton &&
      messageList.contains(actionsButton)
    ) {
      event.stopPropagation()

      if (state.messageSelectionMode) {
        return
      }

      const messageId = Number(
        actionsButton.dataset.messageOptions
      )

      if (
        !Number.isInteger(messageId) ||
        messageId <= 0
      ) {
        return
      }

      if (state.openMessageMenuId === messageId) {
        closeMessageMenu()
      } else {
        openMessageMenu(messageId, actionsButton)
      }

      return
    }

    // Actions du menu : supprimer, sélectionner ou annuler.
    const menuAction = target.closest(
      '[data-message-menu-action]'
    )

    if (
      menuAction &&
      messageList.contains(menuAction)
    ) {
      event.stopPropagation()

      const action = menuAction.dataset.messageMenuAction
      const messageId = Number(menuAction.dataset.messageId)

      closeMessageMenu()

      if (action === 'edit') {
        startEditingMessage(messageId)
        return
      }

      if (action === 'delete') {
        showDeleteMessagesConfirmation([messageId])
        return
      }

      if (action === 'select') {
        enterMessageSelectionMode(messageId)
        return
      }

      if (action === 'cancel') {
        return
      }
    }

    // En mode sélection, cliquer sur une bulle coche/décoche.
    const row = target.closest('[data-message-row]')

    if (
      row &&
      messageList.contains(row) &&
      state.messageSelectionMode
    ) {
      toggleMessageSelection(row.dataset.messageId)
      return
    }
  })

}
