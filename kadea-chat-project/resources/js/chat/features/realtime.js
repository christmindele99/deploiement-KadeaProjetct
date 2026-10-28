import { Transmit } from '@adonisjs/transmit-client'
import { countedUnreadMessageIds, loadConversations, markConversationAsRead, setUnreadCount, updateConversationPreview, updateLastMessageAfterDeletion } from './conversations.js'
import { renderMessages } from './messages.js'
import { conversationSubscriptions, selectedMessageIds, state } from './state.js'
import { getConversationById, getCurrentUserId, getMessageConversationId, getMessageId, hasMessage, isMyMessage, upsertMessage } from './utils.js'

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

  if (Number(state.selectedConversationId) === conversationId) {
    upsertMessage(message, !alreadyExists)
  }

  const conversation = getConversationById(conversationId)

  if (conversation) {
    conversation.lastMessage = message
    updateConversationPreview(conversationId, message)

    if (!isMyMessage(message) && !countedUnreadMessageIds.has(messageId)) {
      countedUnreadMessageIds.add(messageId)

      if (Number(state.selectedConversationId) === conversationId) {
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

export function handleMessageUpdated(message) {
  if (!message) {
    return
  }

  const messageId = getMessageId(message)
  const conversationId = getMessageConversationId(message)

  if (!messageId || !conversationId) {
    return
  }

  if (Number(state.selectedConversationId) === conversationId) {
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

  if (Number(state.selectedConversationId) === conversationId) {
      state.currentMessages = message.removed
      ? state.currentMessages.filter((item) => getMessageId(item) !== messageId)
      : state.currentMessages.map((item) =>
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

export function initializeTransmit() {
  const currentUserId = getCurrentUserId()

  if (!currentUserId) {
    return
  }

  state.transmit = new Transmit({
    baseUrl: window.location.origin,
    maxReconnectAttempts: 10,
  })

  subscribeToUserChannel(currentUserId)
}

async function subscribeToUserChannel(userId) {
  if (!state.transmit || state.userSubscription) {
    return
  }

  const subscription = state.transmit.subscription(`users/${userId}`)

  state.userSubscription = subscription

  state.userSubscriptionUnsubscribe = subscription.onMessage((payload) => {
    handleRealtimePayload(payload)
  })

  try {
    await subscription.create()
  } catch (error) {
    state.userSubscriptionUnsubscribe?.()
    state.userSubscriptionUnsubscribe = null
    state.userSubscription = null
  }
}

export async function subscribeToConversation(conversationId) {
  if (!state.transmit || !conversationId) {
    return
  }

  const id = Number(conversationId)

  if (!Number.isFinite(id) || id <= 0) {
    return
  }

  if (conversationSubscriptions.has(id)) {
    return
  }

  const subscription = state.transmit.subscription(
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

export async function unsubscribeFromConversation(conversationId) {
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
