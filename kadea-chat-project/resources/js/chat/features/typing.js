import { conversationList, messageInput, state } from './state.js'
import { $, api, getConversationById, getMessageText } from './utils.js'

const TYPING_SEND_INTERVAL_MS = 2500
const TYPING_HIDE_DELAY_MS = 4000

const hideTimers = new Map()
let lastSentAt = 0

// Contenu "En train d'écrire" + 3 points animés (en-tête et liste)
function createTypingContent(label) {
  const text = document.createElement('span')
  text.className = 'italic'
  text.textContent = label

  const dots = document.createElement('span')
  dots.className = 'ml-1.5 inline-flex items-center gap-0.5 align-middle'
  dots.setAttribute('aria-hidden', 'true')

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span')
    dot.className = 'typing-dot'
    dots.appendChild(dot)
  }

  return [text, dots]
}

// Aperçu du dernier message dans la liste des conversations
function getListPreview(conversationId) {
  return conversationList
    ?.querySelector(`.chat-item[data-conversation-id="${conversationId}"]`)
    ?.querySelector('.block.truncate')
}

function showTypingInList(conversationId, label) {
  const preview = getListPreview(conversationId)

  if (!preview) {
    return
  }

  preview.replaceChildren(...createTypingContent(label))
  preview.style.color = '#059669'
  preview.dataset.typing = 'true'
}

// Remet le dernier message à la place de "En train d'écrire"
function hideTypingInList(conversationId) {
  const preview = getListPreview(conversationId)

  if (!preview || preview.dataset.typing !== 'true') {
    return
  }

  const conversation = getConversationById(conversationId)

  delete preview.dataset.typing
  preview.style.color = ''
  preview.textContent = conversation?.lastMessage
    ? getMessageText(conversation.lastMessage)
    : 'Aucun message'
}

// Sans id : cache seulement l'en-tête. Avec id : cache aussi la liste de cette conversation.
export function hideTypingIndicator(conversationId = null) {
  if (conversationId !== null) {
    clearTimeout(hideTimers.get(Number(conversationId)))
    hideTimers.delete(Number(conversationId))

    hideTypingInList(conversationId)
  }

  if (
    conversationId === null ||
    Number(conversationId) === Number(state.selectedConversationId)
  ) {
    $('#chatHeaderTyping')?.classList.add('hidden')
    $('#chatHeaderStatus')?.classList.remove('hidden')
  }
}

export function showTypingIndicator(conversationId, name) {
  const id = Number(conversationId)
  const conversation = getConversationById(id)

  const label = conversation?.groupId
    ? `${name} est en train d'écrire`
    : "En train d'écrire"

  // Dans la liste : visible même si la conversation n'est pas ouverte
  showTypingInList(id, label)

  // Dans l'en-tête : seulement si c'est la conversation ouverte
  if (id === Number(state.selectedConversationId)) {
    const typing = $('#chatHeaderTyping')
    const status = $('#chatHeaderStatus')

    if (typing) {
      typing.replaceChildren(...createTypingContent(label))
      typing.classList.remove('hidden')
      status?.classList.add('hidden')
    }
  }

  // Sans nouveau signal pendant 4 secondes, l'indicateur disparaît
  clearTimeout(hideTimers.get(id))
  hideTimers.set(id, setTimeout(() => hideTypingIndicator(id), TYPING_HIDE_DELAY_MS))
}

// Envoie "je tape" au serveur pendant que l'utilisateur écrit
export function setupTyping() {
  messageInput?.addEventListener('input', () => {
    const conversationId = state.selectedConversationId

    // Pas de signal pour une nouvelle conversation, ni pendant la modification d'un message
    if (conversationId === null || state.editingMessageId !== null) {
      return
    }

    if (!messageInput.value.trim()) {
      return
    }

    const now = Date.now()

    if (now - lastSentAt < TYPING_SEND_INTERVAL_MS) {
      return
    }

    lastSentAt = now

    api(`/conversations/${conversationId}/typing`, { method: 'POST' }).catch(() => {})
  })
}