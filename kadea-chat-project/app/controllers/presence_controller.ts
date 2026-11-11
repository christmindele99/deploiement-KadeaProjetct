import type { HttpContext } from '@adonisjs/core/http'
import MessageStatusService from '#services/message_status_service'
import transmit from '@adonisjs/transmit/services/main'
import Membership from '#models/membership'

// Un utilisateur est "en ligne" s'il a envoyé un ping il y a moins de 50 secondes
const ONLINE_WINDOW_MS = 50_000

const lastSeenByUser = new Map<number, number>()

export function isUserOnline(userId: number) {
  const lastSeen = lastSeenByUser.get(userId)

  return lastSeen !== undefined && Date.now() - lastSeen < ONLINE_WINDOW_MS
}

export default class PresenceController {
  async ping({ auth, response }: HttpContext) {
    const userId = Number(auth.user!.id)

    const wasOnline = isUserOnline(userId)

    lastSeenByUser.set(userId, Date.now())

    if (!wasOnline) {
      try {
        await MessageStatusService.markReceivedFor(userId)
      } catch (error) {
        console.error('Kadea Chat : erreur de mise à jour des statuts.', error)
      }
    }

    return response.ok({ data: { online: true } })
  }

  async show({ params, response }: HttpContext) {
    const targetId = Number(params.id)

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return response.badRequest({ message: 'Identifiant utilisateur invalide.' })
    }

    const lastSeen = lastSeenByUser.get(targetId)
    const online = lastSeen !== undefined && Date.now() - lastSeen < ONLINE_WINDOW_MS

    return response.ok({ data: { userId: targetId, online } })
  }

  async typing({ params, auth, response }: HttpContext) {
    const userId = Number(auth.user!.id)

    const conversationId = Number(params.id)

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return response.badRequest({ message: 'Identifiant de conversation invalide.' })
    }

    const memberships = await Membership.query().where('conversationId', conversationId)

    if (!memberships.some((membership) => Number(membership.userId) === userId)) {
      return response.notFound({ message: 'Conversation introuvable.' })
    }

    const user = auth.user!
    const name = user.fullName || user.username || 'Utilisateur'

    for (const membership of memberships) {
      if (Number(membership.userId) === userId) continue

      try {
        await transmit.broadcast(`users/${membership.userId}`, {
          type: 'user.typing',
          event: 'user.typing',
          data: { conversationId, userId, name },
        })
      } catch (error) {
        console.error('Kadea Chat : erreur de diffusion "en train d’écrire".', error)
      }
    }

    return response.ok({ data: { sent: true } })
  }
}
