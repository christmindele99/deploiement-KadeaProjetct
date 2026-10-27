import { Transmit } from '@adonisjs/transmit-client'

document.addEventListener('DOMContentLoaded', () => {
  const $ = (selector, parent = document) =>
    parent.querySelector(selector)

  const conversationList = $('#conversationList')
  const mainPanel = $('#mainPanel')
  const emptyChatState = $('#emptyChatState')
  const chatContent = $('#chatContent')
  const messageList = $('#messageList')
  const messageForm = $('#messageForm')
  const messageInput = $('#messageInput')
  const chatSearch = $('#chatSearch')
  const mobileBackToChats = $('#mobileBackToChats')
  const mobileNavigation = $('#mobileNavigation')
  const openNewChatButton = $('#openNewChat')
  const mobileNewChatButton = $('#mobileNewChat')
  const newChatModal = $('#newChatModal')
  const closeNewChatButton = $('#closeNewChat')
  const newChatContacts = $('#newChatContacts')
  const contactSearch = $('#contactSearch')
  const chatItems = $('#chatItems')

  // ==================================================
  // SÉLECTION DES CONVERSATIONS
  // ==================================================

  const conversationSelectionHeader =
    $('#conversationSelectionHeader')
  const conversationSelectionCount =
    $('#conversationSelectionCount')
  const cancelConversationSelection =
    $('#cancelConversationSelection')
  const deleteSelectedConversationsButton =
    $('#deleteSelectedConversationsButton')

  const deleteConfirmModal =
    $('#deleteConversationsConfirmModal')
  const deleteConfirmTitle =
    $('#deleteConversationsConfirmTitle')
  const deleteConfirmMessage =
    $('#deleteConversationsConfirmMessage')
  const deleteConfirmButton =
    $('#confirmDeleteConversations')
  const closeDeleteConfirmButton =
    $('#closeDeleteConversationsConfirm')
  const cancelDeleteConfirmButton =
    $('#cancelDeleteConversations')
  const deleteConversationsError =
    $('#deleteConversationsError')

  // ==================================================
  // SÉLECTION DES MESSAGES
  // ==================================================

  const messageSelectionHeader =
    $('#messageSelectionHeader')
  const messageSelectionCount =
    $('#messageSelectionCount')
  const cancelMessageSelection =
    $('#cancelMessageSelection')
  const deleteSelectedMessagesButton =
    $('#deleteSelectedMessagesButton')

  const deleteMessagesConfirmModal =
    $('#deleteMessagesConfirmModal')
  const deleteMessagesConfirmTitle =
    $('#deleteMessagesConfirmTitle')
  const deleteMessagesConfirmMessage =
    $('#deleteMessagesConfirmMessage')
  const deleteMessagesError =
    $('#deleteMessagesError')
  const closeDeleteMessagesConfirm =
    $('#closeDeleteMessagesConfirm')
  const cancelDeleteMessages =
    $('#cancelDeleteMessages')
  const confirmDeleteMessages =
    $('#confirmDeleteMessages')

  if (
    !conversationList ||
    !mainPanel ||
    !emptyChatState ||
    !chatContent ||
    !messageList ||
    !messageForm ||
    !messageInput
  ) {
    return
  }

  let registeredUsers = []
  let conversations = []
  let selectedConversationId = null
  let selectedRecipient = null
  let currentMessages = []

  let usersLoading = false
  let conversationsLoading = false
  let messagesLoading = false
  let sendingMessage = false

  let transmit = null

  const conversationSubscriptions = new Map()

  let userSubscription = null
  let userSubscriptionUnsubscribe = null

  // ==================================================
  // ÉTAT DES CONVERSATIONS
  // ==================================================

  let conversationSelectionMode = false
  const selectedConversationIds = new Set()
  let openConversationMenuId = null

  let pendingDeleteConversationIds = []
  let deletingConversations = false
  let suppressNextConversationClick = false

  // ==================================================
  // ÉTAT DES MESSAGES
  // ==================================================

  let messageSelectionMode = false
  const selectedMessageIds = new Set()
  let openMessageMenuId = null

  let pendingDeleteMessageIds = []
  let deletingMessages = false
  let suppressNextMessageClick = false
  let editingMessageId = null

  // ==================================================
  // UTILITAIRES
  // ==================================================

  function getCurrentUserId() {
    const id = Number(window.currentUserId)

    return Number.isFinite(id) && id > 0
      ? id
      : null
  }

  function isMobile() {
    return window.matchMedia(
      '(max-width: 767px)'
    ).matches
  }

  function getUserInitials(user) {
    const name = (
      user?.fullName ||
      user?.username ||
      '?'
    ).trim()

    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('')
  }

  function getMessageDateValue(message) {
    return (
      message?.createdAt ??
      message?.created_at ??
      null
    )
  }

  function getMessageDateTimestamp(message) {
    const value = getMessageDateValue(message)

    return value
      ? new Date(value).getTime()
      : NaN
  }

  function formatTime(value) {
    if (!value) return ''

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return ''
    }

    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatDate(value) {
    if (!value) return ''

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return ''
    }

    const today = new Date()
    const yesterday = new Date()

    yesterday.setDate(today.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    }

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year:
        date.getFullYear() !== today.getFullYear()
          ? 'numeric'
          : undefined,
    })
  }

  function getXsrfToken() {
    const cookie = document.cookie
      .split('; ')
      .find((item) => item.startsWith('XSRF-TOKEN='))

    return cookie
      ? decodeURIComponent(
          cookie.substring('XSRF-TOKEN='.length)
        )
      : null
  }

  async function api(url, options = {}) {
    const xsrfToken = getXsrfToken()

    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        Accept: 'application/json',

        ...(options.body
          ? {
              'Content-Type': 'application/json',
            }
          : {}),

        ...(xsrfToken
          ? {
              'X-XSRF-TOKEN': xsrfToken,
            }
          : {}),

        ...options.headers,
      },
    })

    const result = await response
      .json()
      .catch(() => ({}))

    if (response.redirected) {
      throw new Error('REQUEST_REDIRECTED')
    }

    if (response.status === 401) {
      throw new Error('SESSION_EXPIRED')
    }

    if (!response.ok) {
      throw new Error(
        result.message ||
          `REQUEST_FAILED_${response.status}`
      )
    }

    return result
  }

  function getData(result) {
    if (Array.isArray(result)) {
      return result
    }

    if (Array.isArray(result?.data)) {
      return result.data
    }

    return []
  }

  function getConversationById(id) {
    return conversations.find(
      (conversation) =>
        Number(conversation.id) === Number(id)
    )
  }

  function getConversationPeerId(conversation) {
    if (!conversation) {
      return null
    }

    if (conversation.otherUser?.id) {
      return Number(conversation.otherUser.id)
    }

    const ids = String(conversation.pairKey || '')
      .split(':')
      .map(Number)
      .filter(Number.isFinite)

    const currentUserId = getCurrentUserId()

    return currentUserId
      ? ids.find((id) => id !== currentUserId) ?? null
      : null
  }

  function getConversationUser(conversation) {
    if (conversation?.otherUser) {
      return conversation.otherUser
    }

    const peerId = getConversationPeerId(conversation)

    if (!peerId) return null

    return (
      registeredUsers.find(
        (user) => Number(user.id) === peerId
      ) || null
    )
  }

  function getConversationName(conversation) {
    if (conversation?.otherUser) {
      return (
        conversation.otherUser.fullName ||
        conversation.otherUser.username ||
        'Utilisateur'
      )
    }

    if (conversation?.groupId) {
      return conversation.group?.name || 'Groupe'
    }

    const user = getConversationUser(conversation)

    return (
      user?.fullName ||
      user?.username ||
      'Conversation privée'
    )
  }

    function getMessageText(message) {
    if (message?.deletedAt) {
      return 'Ce message a été supprimé'
    }

    return message?.content ?? message?.text ?? ''
  }

  function getMessageAuthorId(message) {
    return Number(
      message?.authorId ??
        message?.author_id ??
        message?.author?.id ??
        0
    )
  }

  function getMessageId(message) {
    return Number(message?.id)
  }

  function getMessageConversationId(message) {
    return Number(
      message?.conversationId ??
        message?.conversation_id ??
        0
    )
  }

  function isMyMessage(message) {
    const currentUserId = getCurrentUserId()
    const authorId = getMessageAuthorId(message)

    return Boolean(
      currentUserId &&
        Number.isFinite(authorId) &&
        authorId > 0 &&
        authorId === currentUserId
    )
  }

  function sortMessages(messages) {
    return [...messages].sort((a, b) => {
      const dateA = getMessageDateTimestamp(a)
      const dateB = getMessageDateTimestamp(b)

      if (
        Number.isFinite(dateA) &&
        Number.isFinite(dateB) &&
        dateA !== dateB
      ) {
        return dateA - dateB
      }

      const idA = getMessageId(a)
      const idB = getMessageId(b)

      if (
        Number.isFinite(idA) &&
        Number.isFinite(idB)
      ) {
        return idA - idB
      }

      return 0
    })
  }

  function hasMessage(messageId) {
    return currentMessages.some(
      (message) =>
        getMessageId(message) === Number(messageId)
    )
  }

  function upsertMessage(message, shouldScroll = true) {
    if (!message) return

    const messageId = getMessageId(message)

    if (
      !Number.isFinite(messageId) ||
      messageId <= 0
    ) {
      return
    }

    const existingIndex = currentMessages.findIndex(
      (item) => getMessageId(item) === messageId
    )

    if (existingIndex === -1) {
      currentMessages.push(message)
    } else {
      currentMessages[existingIndex] = message
    }

    currentMessages = sortMessages(currentMessages)
    renderMessages(shouldScroll)
  }

  // ==================================================
  // UTILISATEURS
  // ==================================================

  function showUsersMessage(message, isError = false) {
    if (!newChatContacts) {
      return
    }

    newChatContacts.replaceChildren()

    const paragraph = document.createElement('p')

    paragraph.className = 'py-4 text-center text-sm'

    paragraph.classList.add(
      isError ? 'text-red-500' : 'text-gray-500'
    )

    paragraph.textContent = message

    newChatContacts.appendChild(paragraph)
  }

  function createUserElement(user) {
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

  function renderRegisteredUsers(query = '') {
    if (!newChatContacts) {
      return
    }

    const currentUserId = getCurrentUserId()
    const normalizedQuery = query.trim().toLowerCase()

    const filteredUsers = registeredUsers
      .filter(
        (user) =>
          Number(user.id) !== Number(currentUserId)
      )
      .filter((user) => {
        const fullName = (
          user.fullName || ''
        ).toLowerCase()

        const username = (
          user.username || ''
        ).toLowerCase()

        return (
          fullName.includes(normalizedQuery) ||
          username.includes(normalizedQuery)
        )
      })

    newChatContacts.replaceChildren()

    if (!filteredUsers.length) {
      showUsersMessage(
        normalizedQuery
          ? 'Aucun utilisateur ne correspond à ta recherche.'
          : 'Aucun autre utilisateur inscrit pour le moment.'
      )

      return
    }

    filteredUsers.forEach((user) => {
      newChatContacts.appendChild(createUserElement(user))
    })
  }

  async function loadRegisteredUsers() {
    if (usersLoading) {
      return
    }

    usersLoading = true
    showUsersMessage('Chargement des utilisateurs...')

    try {
      const result = await api('/users')

      registeredUsers = getData(result)

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
      usersLoading = false
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

  function closeNewChatModal() {
    if (!newChatModal) {
      return
    }

    newChatModal.classList.add('hidden')
    newChatModal.classList.remove('flex')
  }

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



    // ==================================================
  // CRÉATION D'UN GROUPE
  // ==================================================

  const createGroupButton = $('#createGroupButton')
  const createGroupModal = $('#createGroupModal')
  const closeCreateGroupButton = $('#closeCreateGroup')
  const cancelCreateGroupButton = $('#cancelCreateGroup')
  const confirmCreateGroupButton = $('#confirmCreateGroup')
  const groupNameInput = $('#groupName')
  const groupDescriptionInput = $('#groupDescription')
  const groupMemberSearch = $('#groupMemberSearch')
  const groupMembersList = $('#groupMembersList')
  const groupSelectedCount = $('#groupSelectedCount')
  const createGroupError = $('#createGroupError')

  const selectedGroupMemberIds = new Set()
  let creatingGroup = false

  const CREATE_GROUP_BUTTON_HTML =
    '<i class="fa-solid fa-users" aria-hidden="true"></i><span>Créer le groupe</span>'

  function showCreateGroupError(message) {
    if (!createGroupError) return

    createGroupError.textContent = message
    createGroupError.classList.toggle('hidden', !message)
  }

  function updateCreateGroupUI() {
    if (groupSelectedCount) {
      groupSelectedCount.textContent = String(selectedGroupMemberIds.size)
    }

    if (confirmCreateGroupButton) {
      confirmCreateGroupButton.disabled =
        creatingGroup ||
        groupNameInput.value.trim().length < 2 ||
        selectedGroupMemberIds.size === 0
    }
  }

  function renderGroupMembers(query = '') {
    if (!groupMembersList) return

    const currentUserId = getCurrentUserId()
    const normalizedQuery = query.trim().toLowerCase()

    const users = registeredUsers
      .filter((user) => Number(user.id) !== currentUserId)
      .filter(
        (user) =>
          (user.fullName || '').toLowerCase().includes(normalizedQuery) ||
          (user.username || '').toLowerCase().includes(normalizedQuery)
      )

    groupMembersList.replaceChildren()

    if (!users.length) {
      const empty = document.createElement('p')

      empty.className = 'py-4 text-center text-sm text-gray-500'
      empty.textContent = 'Aucun utilisateur trouvé.'
      groupMembersList.appendChild(empty)

      return
    }

    users.forEach((user) => {
      const label = document.createElement('label')

      label.className =
        'flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-emerald-50'

      const checkbox = document.createElement('input')

      checkbox.type = 'checkbox'
      checkbox.className =
        'h-4 w-4 shrink-0 cursor-pointer accent-[#075e8d]'
      checkbox.checked = selectedGroupMemberIds.has(Number(user.id))

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedGroupMemberIds.add(Number(user.id))
        } else {
          selectedGroupMemberIds.delete(Number(user.id))
        }

        updateCreateGroupUI()
      })

      // Réutilise l'avatar + nom de createUserElement
      const userItem = createUserElement(user)

      label.append(checkbox, ...userItem.childNodes)
      groupMembersList.appendChild(label)
    })
  }

  function openCreateGroupModal() {
    if (!createGroupModal) return

    closeNewChatModal()

    selectedGroupMemberIds.clear()
    groupNameInput.value = ''
    groupDescriptionInput.value = ''
    groupMemberSearch.value = ''
    showCreateGroupError('')

    renderGroupMembers()
    updateCreateGroupUI()

    createGroupModal.classList.remove('hidden')
    createGroupModal.classList.add('flex')

    if (!registeredUsers.length) {
      loadRegisteredUsers().then(() => renderGroupMembers())
    }

    groupNameInput.focus()
  }

  function closeCreateGroupModal() {
    if (!createGroupModal || creatingGroup) return

    createGroupModal.classList.add('hidden')
    createGroupModal.classList.remove('flex')
  }

  async function createGroup() {
    if (creatingGroup) return

    const name = groupNameInput.value.trim()

    if (name.length < 2) {
      showCreateGroupError('Le nom du groupe doit contenir au moins 2 caractères.')
      return
    }

    if (!selectedGroupMemberIds.size) {
      showCreateGroupError('Sélectionne au moins un membre.')
      return
    }

    creatingGroup = true
    showCreateGroupError('')

    confirmCreateGroupButton.disabled = true
    confirmCreateGroupButton.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Création...</span>'

    try {
      const result = await api('/groups', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: groupDescriptionInput.value.trim(),
          memberIds: Array.from(selectedGroupMemberIds),
        }),
      })

      const conversationId = Number(result?.data?.conversationId)

      creatingGroup = false
      closeCreateGroupModal()

      await loadConversations(true)

      if (conversationId) {
        selectConversation(conversationId)
      }
    } catch (error) {
      if (error.message === 'SESSION_EXPIRED') {
        window.location.reload()
        return
      }

      showCreateGroupError(
        error.message.startsWith('REQUEST_FAILED')
          ? 'Impossible de créer le groupe. Réessaie.'
          : error.message
      )
    } finally {
      creatingGroup = false
      confirmCreateGroupButton.innerHTML = CREATE_GROUP_BUTTON_HTML
      updateCreateGroupUI()
    }
  }

  createGroupButton?.addEventListener('click', openCreateGroupModal)
  closeCreateGroupButton?.addEventListener('click', closeCreateGroupModal)
  cancelCreateGroupButton?.addEventListener('click', closeCreateGroupModal)
  confirmCreateGroupButton?.addEventListener('click', createGroup)
  groupNameInput?.addEventListener('input', updateCreateGroupUI)

  groupMemberSearch?.addEventListener('input', () => {
    renderGroupMembers(groupMemberSearch.value)
  })

  createGroupModal?.addEventListener('click', (event) => {
    if (event.target === createGroupModal) {
      closeCreateGroupModal()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      createGroupModal &&
      !createGroupModal.classList.contains('hidden')
    ) {
      closeCreateGroupModal()
    }
  })



  // ==================================================
  // MENU D'ACTIONS DES MESSAGES
  // ==================================================

  function closeMessageMenu() {
    openMessageMenuId = null

    messageList
      .querySelectorAll('[data-message-menu]')
      .forEach((menu) => menu.remove())
  }

  function hideMessageActions() {
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
    const messageData = currentMessages.find(
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
    if (messageSelectionMode) {
      return
    }

    closeMessageMenu()

    const row = actionsButton.closest('[data-message-row]')

    if (!row) {
      return
    }

    const menu = createMessageMenu(messageId)

    row.appendChild(menu)

    openMessageMenuId = Number(messageId)
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
            !messageSelectionMode
          )
        }

        row.classList.toggle(
          'message-selected',
          messageSelectionMode && isSelected
        )

        if (actionsButton) {
          actionsButton.style.display = messageSelectionMode ? 'none' : 'flex'
        }
      })

    if (messageSelectionHeader) {
      messageSelectionHeader.classList.toggle(
        'hidden',
        !messageSelectionMode
      )

      messageSelectionHeader.classList.toggle(
        'flex',
        messageSelectionMode
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
        deletingMessages
    }
  }

  function enterMessageSelectionMode(initialMessageId = null) {
    closeMessageMenu()

    messageSelectionMode = true
    selectedMessageIds.clear()

    if (
      initialMessageId !== null &&
      hasMessage(initialMessageId)
    ) {
      selectedMessageIds.add(Number(initialMessageId))
    }

    updateMessageSelectionUI()
  }

  function exitMessageSelectionMode() {
    messageSelectionMode = false
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

  cancelMessageSelection?.addEventListener(
    'click',
    exitMessageSelectionMode
  )


  const defaultMessagePlaceholder = messageInput.placeholder

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
    const message = currentMessages.find(
      (item) => getMessageId(item) === Number(messageId)
    )

    if (!message || message.deletedAt || !isMyMessage(message)) {
      return
    }

    closeMessageMenu()

    editingMessageId = getMessageId(message)
    setEditingUI(true)

    messageInput.value = message.content ?? ''
    messageInput.focus()

    messageInput.setSelectionRange(
      messageInput.value.length,
      messageInput.value.length
    )
  }

  function cancelEditingMessage() {
    if (editingMessageId === null) {
      return
    }

    editingMessageId = null
    messageInput.value = ''
    setEditingUI(false)
  }

  async function submitMessageEdit(content) {
    const messageId = editingMessageId

    const original = currentMessages.find(
      (item) => getMessageId(item) === messageId
    )

    // Rien n'a changé : on quitte simplement le mode édition
    if (!original || original.content === content) {
      cancelEditingMessage()
      return
    }

    sendingMessage = true
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
      sendingMessage = false
      messageInput.disabled = false
      messageInput.focus()
    }
  }


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

  function initializeLayout() {
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
  // INFOS DU GROUPE
  // ==================================================

  const groupInfoModal = $('#groupInfoModal')
  const closeGroupInfoButton = $('#closeGroupInfo')
  const groupInfoAvatar = $('#groupInfoAvatar')
  const groupInfoName = $('#groupInfoName')
  const groupInfoDescription = $('#groupInfoDescription')
  const groupInfoMembersCount = $('#groupInfoMembersCount')
  const groupInfoSearch = $('#groupInfoSearch')
  const groupInfoMembers = $('#groupInfoMembers')
  const groupInfoError = $('#groupInfoError')

  let groupInfo = null

  function showGroupInfoError(message) {
    if (!groupInfoError) return

    groupInfoError.textContent = message
    groupInfoError.classList.toggle('hidden', !message)
  }

  function showGroupInfoMessage(message) {
    groupInfoMembers.replaceChildren()

    const paragraph = document.createElement('p')

    paragraph.className = 'py-4 text-center text-sm text-gray-500'
    paragraph.textContent = message

    groupInfoMembers.appendChild(paragraph)
  }

  function renderGroupInfoHeader(name, description, avatarUrl) {
    groupInfoName.textContent = name || 'Groupe'
    groupInfoDescription.textContent =
      description || 'Aucune description.'

    groupInfoAvatar.replaceChildren()
    groupInfoAvatar.textContent = ''

    if (avatarUrl) {
      const img = document.createElement('img')

      img.src = avatarUrl
      img.alt = ''
      img.className = 'h-full w-full object-cover'

      img.addEventListener(
        'error',
        () => {
          img.remove()
          groupInfoAvatar.textContent = getUserInitials({
            fullName: name,
          })
        },
        { once: true }
      )

      groupInfoAvatar.appendChild(img)
    } else {
      groupInfoAvatar.textContent = getUserInitials({
        fullName: name,
      })
    }
  }

  function renderGroupInfoMembers(query = '') {
    if (!groupInfo || !groupInfoMembers) return

    const normalizedQuery = query.trim().toLowerCase()
    const currentUserId = getCurrentUserId()

    groupInfoMembersCount.textContent = String(groupInfo.members.length)

    const members = groupInfo.members
      .filter(
        (member) =>
          (member.fullName || '').toLowerCase().includes(normalizedQuery) ||
          (member.username || '').toLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => {
        if (a.roleId !== b.roleId) {
          return a.roleId - b.roleId
        }

        return (a.fullName || '').localeCompare(b.fullName || '', 'fr')
      })

    if (!members.length) {
      showGroupInfoMessage('Aucun membre trouvé.')
      return
    }

    groupInfoMembers.replaceChildren()

    members.forEach((member) => {
      const row = document.createElement('div')

      row.className = 'flex w-full items-center gap-3 rounded-xl p-3'

      const avatar = document.createElement('div')

      avatar.className =
        'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#075e8d] text-sm font-semibold text-white'

      if (member.avatar) {
        const img = document.createElement('img')

        img.src = member.avatar
        img.alt = ''
        img.className = 'h-full w-full object-cover'

        img.addEventListener(
          'error',
          () => {
            img.remove()
            avatar.textContent = getUserInitials(member)
          },
          { once: true }
        )

        avatar.appendChild(img)
      } else {
        avatar.textContent = getUserInitials(member)
      }

      const details = document.createElement('div')

      details.className = 'min-w-0 flex-1'

      const name = document.createElement('p')

      name.className = 'truncate text-sm font-semibold text-slate-800'
      name.textContent =
        (member.fullName || member.username || 'Utilisateur') +
        (Number(member.id) === currentUserId ? ' (Vous)' : '')

      const username = document.createElement('p')

      username.className = 'truncate text-xs text-slate-500'
      username.textContent = member.username ? `@${member.username}` : ''

      details.append(name, username)

      const isAdmin = member.roleId === 1
      const badge = document.createElement('span')

      badge.className =
        'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ' +
        (isAdmin
          ? 'bg-emerald-500/15 text-emerald-700'
          : 'bg-sky-500/15 text-sky-700')

      badge.textContent = isAdmin ? 'Admin' : 'Membre'

      row.append(avatar, details, badge)
      groupInfoMembers.appendChild(row)
    })
  }

  async function openGroupInfo() {
    const conversation = getConversationById(selectedConversationId)

    if (!conversation?.groupId || !groupInfoModal) {
      return
    }

    groupInfo = null
    updateGroupInfoMenu()
    groupInfoSearch.value = ''
    groupInfoMembersCount.textContent = '0'
    showGroupInfoError('')

    // Affichage immédiat avec les infos déjà connues
    renderGroupInfoHeader(
      conversation.group?.name,
      conversation.group?.description,
      conversation.group?.avatar
    )

    showGroupInfoMessage('Chargement des membres...')

    groupInfoModal.classList.remove('hidden')
    groupInfoModal.classList.add('flex')

    try {
      const result = await api(`/conversations/${conversation.id}/group`)

      groupInfo = result.data
      updateGroupInfoMenu()

      renderGroupInfoHeader(
        groupInfo.group.name,
        groupInfo.group.description,
        groupInfo.group.avatar
      )

      renderGroupInfoMembers()
    } catch (error) {
      if (error.message === 'SESSION_EXPIRED') {
        window.location.reload()
        return
      }

      groupInfoMembers.replaceChildren()
      showGroupInfoError('Impossible de charger les infos du groupe.')
    }
  }

  function closeGroupInfo() {
    if (!groupInfoModal) return
    closeGroupInfoMenu()
    groupInfoModal.classList.add('hidden')
    groupInfoModal.classList.remove('flex')
  }

  $('#chatHeaderName')?.addEventListener('click', openGroupInfo)
  $('#chatHeaderAvatar')?.addEventListener('click', openGroupInfo)

  closeGroupInfoButton?.addEventListener('click', closeGroupInfo)

  groupInfoSearch?.addEventListener('input', () => {
    renderGroupInfoMembers(groupInfoSearch.value)
  })

  groupInfoModal?.addEventListener('click', (event) => {
    if (event.target === groupInfoModal) {
      closeGroupInfo()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      groupInfoModal &&
      !groupInfoModal.classList.contains('hidden')
    ) {
      closeGroupInfo()
    }
  })


    // ==================================================
  // MENU DES OPTIONS DU GROUPE (ADMIN)
  // ==================================================

  const groupInfoMenuWrapper = $('#groupInfoMenuWrapper')
  const groupInfoMenuButton = $('#groupInfoMenuButton')
  const groupInfoMenu = $('#groupInfoMenu')

  function closeGroupInfoMenu() {
    groupInfoMenu?.classList.add('hidden')
  }

  function updateGroupInfoMenu() {
    const isAdmin = groupInfo?.myRole === 'admin'

    groupInfoMenuWrapper?.classList.toggle('hidden', !isAdmin)

    if (!isAdmin) {
      closeGroupInfoMenu()
    }
  }

    function handleGroupAction(action) {
      if (action === 'edit-info') {
        openEditGroupModal()
        return
      }

      // Les étapes suivantes viendront ici.
      console.log('Action de groupe :', action)
    }

  groupInfoMenuButton?.addEventListener('click', (event) => {
    event.stopPropagation()
    groupInfoMenu?.classList.toggle('hidden')
  })

  groupInfoMenu?.addEventListener('click', (event) => {
    const target = event.target

    if (!(target instanceof Element)) {
      return
    }

    const button = target.closest('[data-group-action]')

    if (!button) {
      return
    }

    closeGroupInfoMenu()
    handleGroupAction(button.dataset.groupAction)
  })

  document.addEventListener('click', (event) => {
    if (
      event.target instanceof Element &&
      !event.target.closest('#groupInfoMenuWrapper')
    ) {
      closeGroupInfoMenu()
    }
  })





    // ==================================================
  // MODIFIER LE NOM ET LA DESCRIPTION DU GROUPE
  // ==================================================

  const editGroupModal = $('#editGroupModal')
  const editGroupNameInput = $('#editGroupName')
  const editGroupDescriptionInput = $('#editGroupDescription')
  const editGroupError = $('#editGroupError')
  const saveEditGroupButton = $('#saveEditGroup')
  const cancelEditGroupButton = $('#cancelEditGroup')
  const closeEditGroupButton = $('#closeEditGroup')

  let savingGroupInfo = false

  function showEditGroupError(message) {
    if (!editGroupError) return

    editGroupError.textContent = message
    editGroupError.classList.toggle('hidden', !message)
  }

  function updateEditGroupUI() {
    if (saveEditGroupButton) {
      saveEditGroupButton.disabled =
        savingGroupInfo || editGroupNameInput.value.trim().length < 2
    }
  }

  function openEditGroupModal() {
    if (!groupInfo || groupInfo.myRole !== 'admin' || !editGroupModal) {
      return
    }

    editGroupNameInput.value = groupInfo.group.name || ''
    editGroupDescriptionInput.value = groupInfo.group.description || ''

    showEditGroupError('')
    updateEditGroupUI()

    editGroupModal.classList.remove('hidden')
    editGroupModal.classList.add('flex')

    editGroupNameInput.focus()
  }

  function closeEditGroupModal() {
    if (!editGroupModal || savingGroupInfo) return

    editGroupModal.classList.add('hidden')
    editGroupModal.classList.remove('flex')
  }

  async function saveGroupInfo() {
    if (savingGroupInfo) return

    const name = editGroupNameInput.value.trim()

    if (name.length < 2) {
      showEditGroupError('Le nom du groupe doit contenir au moins 2 caractères.')
      return
    }

    savingGroupInfo = true
    showEditGroupError('')
    saveEditGroupButton.disabled = true
    saveEditGroupButton.innerHTML = '<span>Enregistrement...</span>'

    try {
      const result = await api(`/conversations/${selectedConversationId}/group`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description: editGroupDescriptionInput.value.trim(),
        }),
      })

      const updatedGroup = result.data.group

      groupInfo.group = { ...groupInfo.group, ...updatedGroup }

      renderGroupInfoHeader(
        groupInfo.group.name,
        groupInfo.group.description,
        groupInfo.group.avatar
      )

      savingGroupInfo = false
      closeEditGroupModal()

      await loadConversations(true)
    } catch (error) {
      if (error.message === 'SESSION_EXPIRED') {
        window.location.reload()
        return
      }

      showEditGroupError(
        error.message.startsWith('REQUEST_FAILED')
          ? 'Impossible de modifier le groupe. Réessaie.'
          : error.message
      )
    } finally {
      savingGroupInfo = false
      saveEditGroupButton.innerHTML = '<span>Enregistrer</span>'
      updateEditGroupUI()
    }
  }

  saveEditGroupButton?.addEventListener('click', saveGroupInfo)
  cancelEditGroupButton?.addEventListener('click', closeEditGroupModal)
  closeEditGroupButton?.addEventListener('click', closeEditGroupModal)
  editGroupNameInput?.addEventListener('input', updateEditGroupUI)

  editGroupModal?.addEventListener('click', (event) => {
    if (event.target === editGroupModal) {
      closeEditGroupModal()
    }
  })




  // ==================================================
  // MENU D'ACTIONS D'UNE CONVERSATION
  // ==================================================

  function closeConversationMenu() {
    openConversationMenuId = null

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
    if (conversationSelectionMode) {
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
    openConversationMenuId = Number(conversationId)
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
            !conversationSelectionMode
          )
        }

        item.classList.toggle(
          'bg-slate-50',
          conversationSelectionMode && isSelected
        )

        if (actionsButton) {
          actionsButton.classList.toggle(
            'hidden',
            conversationSelectionMode
          )

          actionsButton.classList.toggle(
            'flex',
            !conversationSelectionMode
          )
        }
      })

    if (conversationSelectionHeader) {
      conversationSelectionHeader.classList.toggle(
        'hidden',
        !conversationSelectionMode
      )

      conversationSelectionHeader.classList.toggle(
        'flex',
        conversationSelectionMode
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
        deletingConversations
    }
  }

  function enterConversationSelectionMode() {
    closeConversationMenu()

    conversationSelectionMode = true
    selectedConversationIds.clear()

    updateSelectionUI()
  }

  function exitConversationSelectionMode() {
    conversationSelectionMode = false
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

  cancelConversationSelection?.addEventListener(
    'click',
    exitConversationSelectionMode
  )

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

    if (!validIds.length || deletingConversations) {
      return
    }

    pendingDeleteConversationIds = validIds

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
    if (!deleteConfirmModal || deletingConversations) {
      return
    }

    deleteConfirmModal.classList.add('hidden')
    deleteConfirmModal.classList.remove('flex')

    pendingDeleteConversationIds = []

    if (deleteConversationsError) {
      deleteConversationsError.textContent = ''
      deleteConversationsError.classList.add('hidden')
    }
  }

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

  // ==================================================
  // CONFIRMATION DE SUPPRESSION DES CONVERSATIONS
  // ==================================================

  async function confirmDeleteConversations() {
    if (
      deletingConversations ||
      !pendingDeleteConversationIds.length
    ) {
      return
    }

    const ids = [...pendingDeleteConversationIds]

    deletingConversations = true

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
        conversations = conversations.filter(
          (conversation) =>
            !deletedIds.includes(Number(conversation.id))
        )

        deletedIds.forEach((id) => {
          selectedConversationIds.delete(id)
        })

        if (
          selectedConversationId !== null &&
          deletedIds.includes(Number(selectedConversationId))
        ) {
          selectedConversationId = null
          selectedRecipient = null
          currentMessages = []

          exitMessageSelectionMode()
          showConversationList()

          emptyChatState.classList.remove('hidden')
          chatContent.classList.add('hidden')
          chatContent.classList.remove('flex')
        }
      }

      if (failedIds.length) {
        pendingDeleteConversationIds = failedIds

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

        pendingDeleteConversationIds = []

        if (conversationSelectionMode) {
          exitConversationSelectionMode()
        }
      }

      closeConversationMenu()
      renderConversations()
      updateSelectionUI()
    } finally {
      deletingConversations = false

      if (deleteConfirmButton) {
        deleteConfirmButton.disabled = false

        if (
          !failedIds.length &&
          pendingDeleteConversationIds.length === 0
        ) {
          deleteConfirmButton.innerHTML =
            '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Supprimer</span>'
        }
      }

      updateSelectionUI()
    }
  }

  deleteConfirmButton?.addEventListener(
    'click',
    confirmDeleteConversations
  )



    // ==================================================
  // MESSAGES NON LUS
  // ==================================================

  const countedUnreadMessageIds = new Set()

  function setUnreadCount(conversationId, count) {
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

  async function markConversationAsRead(conversationId) {
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
      suppressNextConversationClick = false

      if (
        event.pointerType === 'mouse' ||
        conversationSelectionMode ||
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
        suppressNextConversationClick = true

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

    conversations = sortConversations(conversations)

    conversations.forEach((conversation) => {
      chatItems.appendChild(createConversationElement(conversation))
    })

    applyCurrentFilter()
    updateSelectionUI()
  }

  async function loadConversations(force = false) {
    if (conversationsLoading && !force) {
      return
    }

    conversationsLoading = true

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

      conversations = sortConversations(newConversations)

      const openConversation = getConversationById(selectedConversationId)

      if (openConversation) {
        openConversation.unreadCount = 0
      }

      const existingIds = new Set(
        conversations.map((conversation) => Number(conversation.id))
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

      if (selectedConversationId !== null) {
        const selectedConversation = conversations.find(
          (conversation) =>
            Number(conversation.id) === Number(selectedConversationId)
        )

        if (!selectedConversation) {
          selectedConversationId = null
          selectedRecipient = null
          currentMessages = []

          exitMessageSelectionMode()
          showConversationList()
        }
      }
    } catch (error) {
      if (error.message === 'SESSION_EXPIRED') {
        window.location.reload()
      }
    } finally {
      conversationsLoading = false
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
      'max-width:min(100%,560px);min-width:0;' +
      `align-items:${mine ? 'flex-end' : 'flex-start'};`

    wrapper.dataset.messageRow = ''
    wrapper.dataset.messageIndex = String(index)
    wrapper.dataset.messageId = String(messageId)
    wrapper.dataset.messageSender = mine ? 'me' : 'them'

    wrapper.className =
    'group max-md:select-none [-webkit-touch-callout:none]'

    const bubble = document.createElement('div')

    bubble.style.cssText =
      'box-sizing:border-box;max-width:100%;padding:12px 16px;' +
      'overflow-wrap:anywhere;word-break:break-word;' +
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
      suppressNextMessageClick = false

      if (
        event.pointerType === 'mouse' ||
        messageSelectionMode ||
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
        suppressNextMessageClick = true

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

  function renderMessages(shouldScroll = true) {
    hideMessageActions()

    currentMessages = sortMessages(currentMessages)

    // Supprime de la sélection les messages qui n'existent plus.
    const currentIds = new Set(
      currentMessages.map((message) => getMessageId(message))
    )

    selectedMessageIds.forEach((id) => {
      if (!currentIds.has(id)) {
        selectedMessageIds.delete(id)
      }
    })

    messageList.replaceChildren()

    let lastDate = null

    currentMessages.forEach((message, index) => {
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

  async function loadMessages(conversationId) {
    if (!conversationId || messagesLoading) {
      return
    }

    messagesLoading = true

    const requestedConversationId = Number(conversationId)

    try {
      const result = await api(
        `/conversations/${requestedConversationId}/messages`
      )

      if (
        Number(selectedConversationId) !==
        requestedConversationId
      ) {
        return
      }

      currentMessages = sortMessages(getData(result))

      selectedMessageIds.clear()
      exitMessageSelectionMode()

      renderMessages(true)
    } catch (error) {
      if (error.message === 'SESSION_EXPIRED') {
        window.location.reload()
      }
    } finally {
      messagesLoading = false
    }
  }

  // ==================================================
  // APERÇU DE CONVERSATION
  // ==================================================

  function updateConversationPreview(conversationId, message) {
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

  function updateLastMessageAfterDeletion(conversationId) {
    const conversation = getConversationById(conversationId)

    if (!conversation) {
      return
    }

    const remainingMessages = sortMessages(
      currentMessages.filter(
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
  // ÉVÉNEMENTS DES MESSAGES EN TEMPS RÉEL
  // ==================================================

  function handleMessageCreated(message) {
    if (!message) {
      return
    }

    const messageId = getMessageId(message)
    const conversationId = getMessageConversationId(message)

    if (
      !Number.isFinite(messageId) ||
      messageId <= 0 ||
      !Number.isFinite(conversationId) ||
      conversationId <= 0
    ) {
      return
    }

    const alreadyExists = hasMessage(messageId)

    if (Number(selectedConversationId) === conversationId) {
      upsertMessage(message, !alreadyExists)
    }

    const conversation = getConversationById(conversationId)

    if (conversation) {
      conversation.lastMessage = message
      updateConversationPreview(conversationId, message)

      if (!isMyMessage(message) && !countedUnreadMessageIds.has(messageId)) {
        countedUnreadMessageIds.add(messageId)

        if (Number(selectedConversationId) === conversationId) {
          markConversationAsRead(conversationId)
        } else {
          setUnreadCount(
            conversationId,
            Number(conversation.unreadCount || 0) + 1
          )
        }
      }
    } else {
      loadConversations(true)
    }
  }

  function handleMessageUpdated(message) {
    if (!message) {
      return
    }

    const messageId = getMessageId(message)
    const conversationId = getMessageConversationId(message)

    if (!messageId || !conversationId) {
      return
    }

    if (Number(selectedConversationId) === conversationId) {
      upsertMessage(message, false)
    }

    const conversation = getConversationById(conversationId)

    if (
      conversation?.lastMessage &&
      getMessageId(conversation.lastMessage) === messageId
    ) {
      updateConversationPreview(conversationId, message)
    }
  }

  function handleMessageDeleted(message) {
    if (!message) {
      return
    }

    const messageId = Number(message.id)
    const conversationId = Number(
      message.conversationId ?? message.conversation_id
    )

    if (!messageId || !conversationId) {
      return
    }

    if (Number(selectedConversationId) === conversationId) {
        currentMessages = message.removed
        ? currentMessages.filter((item) => getMessageId(item) !== messageId)
        : currentMessages.map((item) =>
            getMessageId(item) === messageId
              ? { ...item, content: null, deletedAt: message.deletedAt }
              : item
          )

      selectedMessageIds.delete(messageId)

      renderMessages(true)

      updateLastMessageAfterDeletion(conversationId)
    }

    loadConversations(true)
  }

  function handleRealtimePayload(payload) {
    if (!payload) {
      return
    }

    const eventType = payload.event || payload.type
    const message = payload.data || payload.message

    if (eventType === 'message.created') {
      handleMessageCreated(message)
      return
    }

    if (eventType === 'message.updated') {
      handleMessageUpdated(message)
      return
    }

    if (eventType === 'message.deleted') {
      handleMessageDeleted(message)
      return
    }

    if (eventType === 'user.notification') {
      if (message?.id || payload.data?.id) {
        handleMessageCreated(message || payload.data)
      }

      loadConversations(true)
    }
  }

  // ==================================================
  // TRANSMIT
  // ==================================================

  function initializeTransmit() {
    const currentUserId = getCurrentUserId()

    if (!currentUserId) {
      return
    }

    transmit = new Transmit({
      baseUrl: window.location.origin,
      maxReconnectAttempts: 10,
    })

    subscribeToUserChannel(currentUserId)
  }

  async function subscribeToUserChannel(userId) {
    if (!transmit || userSubscription) {
      return
    }

    const subscription = transmit.subscription(`users/${userId}`)

    userSubscription = subscription

    userSubscriptionUnsubscribe = subscription.onMessage((payload) => {
      handleRealtimePayload(payload)
    })

    try {
      await subscription.create()
    } catch (error) {
      userSubscriptionUnsubscribe?.()
      userSubscriptionUnsubscribe = null
      userSubscription = null
    }
  }

  async function subscribeToConversation(conversationId) {
    if (!transmit || !conversationId) {
      return
    }

    const id = Number(conversationId)

    if (!Number.isFinite(id) || id <= 0) {
      return
    }

    if (conversationSubscriptions.has(id)) {
      return
    }

    const subscription = transmit.subscription(
      `conversations/${id}/messages`
    )

    const unsubscribe = subscription.onMessage((payload) => {
      handleRealtimePayload(payload)
    })

    try {
      await subscription.create()

      conversationSubscriptions.set(id, {
        subscription,
        unsubscribe,
      })
    } catch (error) {
      unsubscribe?.()
    }
  }

  async function unsubscribeFromConversation(conversationId) {
    const id = Number(conversationId)
    const entry = conversationSubscriptions.get(id)

    if (!entry) {
      return
    }

    try {
      entry.unsubscribe?.()
      await entry.subscription.delete()
    } catch (error) {
      // La suppression de la conversation reste prioritaire.
    } finally {
      conversationSubscriptions.delete(id)
    }
  }

  // ==================================================
  // OUVERTURE D'UNE CONVERSATION
  // ==================================================

  async function selectConversation(conversationId) {
    if (conversationSelectionMode) {
      toggleConversationSelection(conversationId)
      return
    }

    const conversation = getConversationById(conversationId)

    if (!conversation) return
    exitMessageSelectionMode()
    cancelEditingMessage()

    selectedConversationId = Number(conversation.id)
    selectedRecipient = null
    currentMessages = []

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

    selectedConversationId = null
    selectedRecipient = user
    currentMessages = []

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

  newChatContacts?.addEventListener('click', (event) => {
    const target = event.target

    if (!(target instanceof Element)) {
      return
    }

    const button = target.closest('[data-start-chat]')

    if (!button) {
      return
    }

    const user = registeredUsers.find(
      (item) => String(item.id) === button.dataset.startChat
    )

    if (
      !user ||
      Number(user.id) === Number(getCurrentUserId())
    ) {
      return
    }

    const existing = conversations.find((conversation) => {
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
  })

  // ==================================================
  // ENVOI DE MESSAGE
  // ==================================================

  async function sendMessage() {
        if (sendingMessage) {
      return
    }

    const content = messageInput.value.trim()

    // En mode modification : champ vide + envoyer = annuler la modification
    if (editingMessageId !== null) {
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
      selectedConversationId === null &&
      !selectedRecipient
    ) {
      return
    }

    sendingMessage = true
    messageInput.disabled = true

    try {
      let result

      if (selectedConversationId === null) {
        result = await api('/messages', {
          method: 'POST',
          body: JSON.stringify({
            recipientId: selectedRecipient.id,
            content,
          }),
        })
      } else {
        result = await api(
          `/conversations/${selectedConversationId}/messages`,
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

      if (selectedConversationId === null) {
        const peerId = Number(selectedRecipient.id)

        await loadConversations(true)

        const createdConversation = conversations.find(
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

        selectedConversationId = Number(createdConversation.id)
        selectedRecipient = null
        currentMessages = [message]

        renderMessages(true)

        updateConversationPreview(selectedConversationId, message)

        await subscribeToConversation(selectedConversationId)
      } else {
        upsertMessage(message, true)
        updateConversationPreview(selectedConversationId, message)
      }
    } catch (error) {
      if (error.message === 'SESSION_EXPIRED') {
        window.location.reload()
      }
    } finally {
      sendingMessage = false
      messageInput.disabled = false
      messageInput.focus()
    }
  }

  messageForm.addEventListener('submit', (event) => {
    event.preventDefault()
    sendMessage()
  })

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

    if (!validIds.length || deletingMessages) {
      return
    }

    pendingDeleteMessageIds = validIds

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

  function closeDeleteMessagesConfirmation() {
    if (
      !deleteMessagesConfirmModal ||
      deletingMessages
    ) {
      return
    }

    deleteMessagesConfirmModal.classList.add('hidden')
    deleteMessagesConfirmModal.classList.remove('flex')

    pendingDeleteMessageIds = []

    if (deleteMessagesError) {
      deleteMessagesError.textContent = ''
      deleteMessagesError.classList.add('hidden')
    }
  }

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

  // ==================================================
  // SUPPRESSION DES MESSAGES
  // ==================================================

  async function confirmDeleteMessagesAction() {
    if (
      deletingMessages ||
      !pendingDeleteMessageIds.length
    ) {
      return
    }

    const ids = [...pendingDeleteMessageIds]

      const alreadyDeletedIds = new Set(
      ids
        .map(Number)
        .filter((id) =>
          currentMessages.some(
            (message) => getMessageId(message) === id && message.deletedAt
          )
        )
    )

    deletingMessages = true

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
        const message = currentMessages.find(
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
          currentMessages = currentMessages.filter(
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

        if (selectedConversationId !== null) {
          updateLastMessageAfterDeletion(
            selectedConversationId
          )
        }
      }

      if (failedIds.length) {
        pendingDeleteMessageIds = failedIds

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

        pendingDeleteMessageIds = []

        exitMessageSelectionMode()
      }

      updateMessageSelectionUI()
    } finally {
      deletingMessages = false

      if (confirmDeleteMessages) {
        confirmDeleteMessages.disabled = false

        if (
          !failedIds.length &&
          pendingDeleteMessageIds.length === 0
        ) {
          confirmDeleteMessages.innerHTML =
            '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Supprimer</span>'
        }
      }

      updateMessageSelectionUI()
    }
  }

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

    if (suppressNextMessageClick) {
      suppressNextMessageClick = false
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

      if (messageSelectionMode) {
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

      if (openMessageMenuId === messageId) {
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
      messageSelectionMode
    ) {
      toggleMessageSelection(row.dataset.messageId)
      return
    }
  })

  // ==================================================
  // CLICS SUR LES CONVERSATIONS
  // ==================================================

  conversationList.addEventListener('click', (event) => {
    const target = event.target

    if (!(target instanceof Element)) {
      return
    }

    if (suppressNextConversationClick) {
      suppressNextConversationClick = false
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

      if (openConversationMenuId === conversationId) {
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

    if (conversationSelectionMode) {
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
          selectedConversationId === null &&
          !selectedRecipient
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

    if (editingMessageId !== null) {
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
        selectedConversationId !== null ||
        selectedRecipient
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

  // ==================================================
  // NAVIGATION ACTIVE
  // ==================================================

  function setActiveNavigation(section) {
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

  document
    .querySelectorAll('[data-section]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        setActiveNavigation(button.dataset.section)
      })
    })

  // ==================================================
  // INITIALISATION
  // ==================================================

  initializeLayout()

  setActiveNavigation('chats')

  loadRegisteredUsers()
  loadConversations()
  initializeTransmit()
})