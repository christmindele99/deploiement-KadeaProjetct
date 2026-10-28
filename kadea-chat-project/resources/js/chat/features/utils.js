import { renderMessages } from './messages.js'
import { state } from './state.js'

export function $(selector, parent = document) {
  return parent.querySelector(selector)
}

// ==================================================
// UTILITAIRES
// ==================================================

export function getCurrentUserId() {
  const id = Number(window.currentUserId)

  return Number.isFinite(id) && id > 0
    ? id
    : null
}

export function isMobile() {
  return window.matchMedia(
    '(max-width: 767px)'
  ).matches
}

export function getUserInitials(user) {
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

export function getMessageDateValue(message) {
  return (
    message?.createdAt ??
    message?.created_at ??
    null
  )
}

export function getMessageDateTimestamp(message) {
  const value = getMessageDateValue(message)

  return value
    ? new Date(value).getTime()
    : NaN
}

export function formatTime(value) {
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

export function formatDate(value) {
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

export async function api(url, options = {}) {
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

export function getData(result) {
  if (Array.isArray(result)) {
    return result
  }

  if (Array.isArray(result?.data)) {
    return result.data
  }

  return []
}

export function getConversationById(id) {
  return state.conversations.find(
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

export function getConversationUser(conversation) {
  if (conversation?.otherUser) {
    return conversation.otherUser
  }

  const peerId = getConversationPeerId(conversation)

  if (!peerId) return null

  return (
    state.registeredUsers.find(
      (user) => Number(user.id) === peerId
    ) || null
  )
}

export function getConversationName(conversation) {
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

export function getMessageText(message) {
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

export function getMessageId(message) {
  return Number(message?.id)
}

export function getMessageConversationId(message) {
  return Number(
    message?.conversationId ??
      message?.conversation_id ??
      0
  )
}

export function isMyMessage(message) {
  const currentUserId = getCurrentUserId()
  const authorId = getMessageAuthorId(message)

  return Boolean(
    currentUserId &&
      Number.isFinite(authorId) &&
      authorId > 0 &&
      authorId === currentUserId
  )
}

export function sortMessages(messages) {
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

export function hasMessage(messageId) {
  return state.currentMessages.some(
    (message) =>
      getMessageId(message) === Number(messageId)
  )
}

export function upsertMessage(message, shouldScroll = true) {
  if (!message) return

  const messageId = getMessageId(message)

  if (
    !Number.isFinite(messageId) ||
    messageId <= 0
  ) {
    return
  }

  const existingIndex = state.currentMessages.findIndex(
    (item) => getMessageId(item) === messageId
  )

  if (existingIndex === -1) {
    state.currentMessages.push(message)
  } else {
    state.currentMessages[existingIndex] = message
  }

  state.currentMessages = sortMessages(state.currentMessages)
  renderMessages(shouldScroll)
}
