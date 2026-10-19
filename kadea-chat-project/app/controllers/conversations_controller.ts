import type { HttpContext } from '@adonisjs/core/http'
import Conversation from '#models/conversation'
import Membership from '#models/membership'
import User from '#models/user'
import Message from '#models/message'

export default class ConversationsController {
  /**
   * Lister les conversations de l'utilisateur connecté
   */
  

async index({ session, response }: HttpContext) {
  const userId = Number(session.get('userId'))

  if (!userId) {
    return response.unauthorized({
      message: 'Vous devez être connecté pour consulter vos conversations.',
    })
  }

  const memberships = await Membership.query()
    .where('userId', userId)
    .select('conversationId')

  const conversationIds = memberships.map(
    (membership) => membership.conversationId
  )

  if (conversationIds.length === 0) {
    return response.ok({ data: [] })
  }

  const conversations = await Conversation.query()
    .whereIn('id', conversationIds)
    .orderBy('createdAt', 'desc')

  const data = await Promise.all(
    conversations.map(async (conversation) => {
      const result = conversation.serialize()

      // Récupérer le dernier message de la conversation.
      const lastMessage = await Message.query()
        .where('conversationId', conversation.id)
        .orderBy('createdAt', 'desc')
        .orderBy('id', 'desc')
        .first()

      const serializedLastMessage =
        lastMessage?.serialize() ?? null

      // Les conversations de groupe n'ont pas d'autre utilisateur unique.
      if (conversation.groupId) {
        return {
          ...result,
          lastMessage: serializedLastMessage,
          otherUser: null,
        }
      }

      // Identifier l'autre participant.
      const peerMembership = await Membership.query()
        .where('conversationId', conversation.id)
        .whereNot('userId', userId)
        .first()

      let otherUser = null

      if (peerMembership) {
        const user = await User.find(peerMembership.userId)

        if (user) {
          otherUser = {
            id: user.id,
            username: user.username,
            fullName: user.fullName ?? user.username,
            avatar: user.avatar,
            bio: user.bio,
          }
        }
      }

      return {
        ...result,
        lastMessage: serializedLastMessage,
        otherUser,
      }
    })
  )

  return response.ok({ data })
}



  /**
   * Afficher une conversation précise
   */

async show({ params, session, response }: HttpContext) {
  const userId = session.get('userId')

  if (!userId) {
    return response.unauthorized({
      message: 'Vous devez être connecté.',
    })
  }

  // Vérifier que l'utilisateur participe à cette conversation
  const membership = await Membership.query()
    .where('userId', userId)
    .where('conversationId', params.id)
    .first()

  if (!membership) {
    return response.notFound({
      message: 'Conversation introuvable.',
    })
  }

  // Récupérer la conversation
  const conversation = await Conversation.find(params.id)

  if (!conversation) {
    return response.notFound({
      message: 'Conversation introuvable.',
    })
  }

  return response.ok({
    data: conversation,
  })
}


  /**
   * Créer une conversation
   */
  async store({ response }: HttpContext) {
    return response.notImplemented({
      message: 'La création des conversations sera ajoutée ensuite.',
    })
  }

  /**
   * Supprimer ou quitter une conversation
   */
  
  /**
   * Supprimer une conversation de la liste de l'utilisateur connecté
   */
  async destroy({ params, session, response }: HttpContext) {
    const userId = Number(session.get('userId'))

    if (!userId) {
      return response.unauthorized({
        message: 'Vous devez être connecté.',
      })
    }

    const conversationId = Number(params.id)

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return response.badRequest({
        message: 'Identifiant de conversation invalide.',
      })
    }

    // Vérifier que l'utilisateur participe à cette conversation.
    const membership = await Membership.query()
      .where('userId', userId)
      .where('conversationId', conversationId)
      .first()

    if (!membership) {
      return response.notFound({
        message: 'Conversation introuvable.',
      })
    }

    // Supprimer l'association avec l'utilisateur connecté.
    await membership.delete()

    return response.ok({
      message: 'Conversation supprimée de votre liste.',
    })
  }
}
