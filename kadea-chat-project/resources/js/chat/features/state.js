import { $ } from './utils.js'

export const conversationList = $('#conversationList')
export const mainPanel = $('#mainPanel')
export const emptyChatState = $('#emptyChatState')
export const chatContent = $('#chatContent')
export const messageList = $('#messageList')
export const messageForm = $('#messageForm')
export const messageInput = $('#messageInput')
export const chatSearch = $('#chatSearch')
export const mobileBackToChats = $('#mobileBackToChats')
export const mobileNavigation = $('#mobileNavigation')
export const openNewChatButton = $('#openNewChat')
export const mobileNewChatButton = $('#mobileNewChat')
export const newChatModal = $('#newChatModal')
export const closeNewChatButton = $('#closeNewChat')
export const newChatContacts = $('#newChatContacts')
export const contactSearch = $('#contactSearch')
export const chatItems = $('#chatItems')

// ==================================================
// SÉLECTION DES CONVERSATIONS
// ==================================================

export const conversationSelectionHeader =
  $('#conversationSelectionHeader')

export const conversationSelectionCount =
  $('#conversationSelectionCount')

export const cancelConversationSelection =
  $('#cancelConversationSelection')

export const deleteSelectedConversationsButton =
  $('#deleteSelectedConversationsButton')

export const deleteConfirmModal =
  $('#deleteConversationsConfirmModal')

export const deleteConfirmTitle =
  $('#deleteConversationsConfirmTitle')

export const deleteConfirmMessage =
  $('#deleteConversationsConfirmMessage')

export const deleteConfirmButton =
  $('#confirmDeleteConversations')

export const closeDeleteConfirmButton =
  $('#closeDeleteConversationsConfirm')

export const cancelDeleteConfirmButton =
  $('#cancelDeleteConversations')

export const deleteConversationsError =
  $('#deleteConversationsError')

// ==================================================
// SÉLECTION DES MESSAGES
// ==================================================

export const messageSelectionHeader =
  $('#messageSelectionHeader')

export const messageSelectionCount =
  $('#messageSelectionCount')

export const cancelMessageSelection =
  $('#cancelMessageSelection')

export const deleteSelectedMessagesButton =
  $('#deleteSelectedMessagesButton')

export const deleteMessagesConfirmModal =
  $('#deleteMessagesConfirmModal')

export const deleteMessagesConfirmTitle =
  $('#deleteMessagesConfirmTitle')

export const deleteMessagesConfirmMessage =
  $('#deleteMessagesConfirmMessage')

export const deleteMessagesError =
  $('#deleteMessagesError')

export const closeDeleteMessagesConfirm =
  $('#closeDeleteMessagesConfirm')

export const cancelDeleteMessages =
  $('#cancelDeleteMessages')

export const confirmDeleteMessages =
  $('#confirmDeleteMessages')

// ---------- Variables d'état ----------

export const state = {
  registeredUsers: [],
  conversations: [],
  selectedConversationId: null,
  selectedRecipient: null,
  currentMessages: [],
  usersLoading: false,
  conversationsLoading: false,
  messagesLoading: false,
  sendingMessage: false,
  transmit: null,
  userSubscription: null,
  userSubscriptionUnsubscribe: null,
  conversationSelectionMode: false,
  openConversationMenuId: null,
  pendingDeleteConversationIds: [],
  deletingConversations: false,
  suppressNextConversationClick: false,
  messageSelectionMode: false,
  openMessageMenuId: null,
  pendingDeleteMessageIds: [],
  deletingMessages: false,
  suppressNextMessageClick: false,
  editingMessageId: null,
  creatingGroup: false,
  groupInfo: null,
  savingGroupInfo: false,
}

export const conversationSubscriptions = new Map()
export const selectedConversationIds = new Set()
export const selectedMessageIds = new Set()
