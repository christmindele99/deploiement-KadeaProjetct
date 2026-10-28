// Fichier principal du chat : il importe chaque fonctionnalité du dossier features et les démarre

import { initializeLayout, loadConversations, setActiveNavigation, setupConversations } from './features/conversations.js'
import { setupGroups } from './features/groups.js'
import { setupMessages } from './features/messages.js'
import { initializeTransmit } from './features/realtime.js'
import { chatContent, conversationList, emptyChatState, mainPanel, messageForm, messageInput, messageList } from './features/state.js'
import { loadRegisteredUsers, setupUsers } from './features/users.js'

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
  setupConversations()

  // Démarrage

  initializeLayout()

  setActiveNavigation('chats')

  loadRegisteredUsers()
  loadConversations()
  initializeTransmit()
})
