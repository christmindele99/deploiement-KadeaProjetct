import {
  initializeLayout,
  loadConversations,
  setActiveNavigation,
  setupConversations,
} from './features/conversations.js'
import { setupGroups } from './features/groups.js'
import { setupMessages } from './features/messages.js'
import { initializeTransmit } from './features/realtime.js'
import {
  chatContent,
  conversationList,
  emptyChatState,
  mainPanel,
  messageForm,
  messageInput,
  messageList,
} from './features/state.js'
import { enterUsersMode, loadRegisteredUsers, setupUsers } from './features/users.js'
import { startPresence } from './features/presence.js'
import { setupTyping } from './features/typing.js'

document.addEventListener('DOMContentLoaded', () => {
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

  // Écouteurs d'événements (un appel par fonctionnalité)
  setupUsers()
  setupGroups()
  setupMessages()
  setupTyping()
  setupConversations()

  // Démarrage

  initializeLayout()

  setActiveNavigation('chats')
  // Arrivée depuis une autre page (paramètres, profil) avec /chat#users
  if (window.location.hash === '#users') {
    enterUsersMode()
    setActiveNavigation('users')
    history.replaceState(null, '', window.location.pathname)
  }
  loadRegisteredUsers()
  loadConversations()
  initializeTransmit()
  startPresence()
})
