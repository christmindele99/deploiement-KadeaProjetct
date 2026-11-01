import { state } from './state.js'
import { $, api, getConversationById, getConversationUser } from './utils.js'

const PING_INTERVAL_MS = 20000
const PEER_CHECK_INTERVAL_MS = 15000

// Affiche la pastille + "En ligne" ou "Hors ligne" sous le nom
function renderPresence(online) {
  const status = $('#chatHeaderStatus')

  if (!status) {
    return
  }

  const dot = document.createElement('span')

  dot.className =
    'inline-block h-2 w-2 shrink-0 rounded-full ' +
    (online ? 'bg-[#29ff9d]' : 'bg-slate-400')

  const label = document.createElement('span')
  label.textContent = online ? 'En ligne' : 'Hors ligne'

  const wrapper = document.createElement('span')
  wrapper.className = 'inline-flex items-center gap-1.5'
  wrapper.append(dot, label)

  status.replaceChildren(wrapper)
}

// Id de l'interlocuteur (conversation privée ou nouvelle conversation), sinon null
function getCurrentPeerId() {
  if (state.selectedConversationId !== null) {
    const conversation = getConversationById(state.selectedConversationId)

    if (!conversation || conversation.groupId) {
      return null
    }

    const peer = getConversationUser(conversation)

    return peer ? Number(peer.id) : null
  }

  if (state.selectedRecipient) {
    return Number(state.selectedRecipient.id)
  }

  return null
}

export async function refreshPeerPresence() {
  const peerId = getCurrentPeerId()

  if (!peerId) {
    return
  }

  try {
    const result = await api(`/presence/${peerId}`)

    // L'utilisateur a peut-être changé de conversation pendant la requête
    if (getCurrentPeerId() !== peerId) {
      return
    }

    renderPresence(Boolean(result?.data?.online))
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
    }
  }
}

async function sendPing() {
  try {
    await api('/presence/ping', { method: 'POST' })
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') {
      window.location.reload()
    }
  }
}

export function startPresence() {
  sendPing()

  setInterval(sendPing, PING_INTERVAL_MS)
  setInterval(refreshPeerPresence, PEER_CHECK_INTERVAL_MS)

  // Quand l'onglet redevient visible, on se remet à jour tout de suite
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      sendPing()
      refreshPeerPresence()
    }
  })
}