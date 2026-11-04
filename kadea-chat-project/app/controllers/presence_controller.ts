import type { HttpContext } from '@adonisjs/core/http'
import MessageStatusService from '#services/message_status_service'
import transmit from '@adonisjs/transmit/services/main'
import Membership from '#models/membership'
import User from '#models/user'

// Un utilisateur est "en ligne" s'il a envoyé un ping il y a moins de 50 secondes
const ONLINE_WINDOW_MS = 50_000

// userId -> heure du dernier ping (stocké en mémoire du serveur)
const lastSeenByUser = new Map<number, number>()

export function isUserOnline(userId: number) {
  const lastSeen = lastSeenByUser.get(userId)

  return lastSeen !== undefined && Date.now() - lastSeen < ONLINE_WINDOW_MS
}

export default class PresenceController {
  async ping({ session, response }: HttpContext) {
    const userId = Number(session.get('userId'))

    if (!userId) {
      return response.unauthorized({ message: 'Vous devez être connecté.' })
    }

    const wasOnline = isUserOnline(userId)

    lastSeenByUser.set(userId, Date.now())

    // L'utilisateur vient de se connecter : ses messages en attente passent à "Reçu"
    if (!wasOnline) {
      try {
        await MessageStatusService.markReceivedFor(userId)
      } catch (error) {
        console.error('Kadea Chat : erreur de mise à jour des statuts.', error)
      }
    }

    return response.ok({ data: { online: true } })
  }

  async show({ params, session, response }: HttpContext) {
    const userId = Number(session.get('userId'))

    if (!userId) {
      return response.unauthorized({ message: 'Vous devez être connecté.' })
    }

    const targetId = Number(params.id)

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return response.badRequest({ message: 'Identifiant utilisateur invalide.' })
    }

    const lastSeen = lastSeenByUser.get(targetId)
    const online = lastSeen !== undefined && Date.now() - lastSeen < ONLINE_WINDOW_MS

    return response.ok({ data: { userId: targetId, online } })
  }

  async typing({ params, session, response }: HttpContext) {
    const userId = Number(session.get('userId'))

    if (!userId) {
      return response.unauthorized({ message: 'Vous devez être connecté.' })
    }

    const conversationId = Number(params.id)

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return response.badRequest({ message: 'Identifiant de conversation invalide.' })
    }

    const memberships = await Membership.query().where('conversationId', conversationId)

    // Seuls les membres de la conversation peuvent signaler qu'ils écrivent
    if (!memberships.some((membership) => Number(membership.userId) === userId)) {
      return response.notFound({ message: 'Conversation introuvable.' })
    }

    const user = await User.find(userId)
    const name = user?.fullName || user?.username || 'Utilisateur'

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
