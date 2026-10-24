import type { HttpContext } from '@adonisjs/core/http'
import Conversation from '#models/conversation'
import Membership from '#models/membership'
import User from '#models/user'
import Message from '#models/message'
import Group from '#models/group'

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

    // Mes participations, avec la date de dernière lecture de chacune
    const memberships = await Membership.query().where('userId', userId)

    const lastReadByConversation = new Map(
      memberships.map((membership) => [membership.conversationId, membership.lastReadAt])
    )

    const favoriteByConversation = new Map(
      memberships.map((membership) => [membership.conversationId, membership.isFavorite])
    )

    const clearedByConversation = new Map(
      memberships.map((membership) => [membership.conversationId, membership.clearedAt])
    )

    const conversationIds = [...lastReadByConversation.keys()]

    if (conversationIds.length === 0) {
      return response.ok({ data: [] })
    }

    const conversations = await Conversation.query()
      .whereIn('id', conversationIds)
      .orderBy('createdAt', 'desc')

    const data = await Promise.all(
      conversations.map(async (conversation) => {
        const result = conversation.serialize()

        const clearedAt = clearedByConversation.get(conversation.id)
        const lastReadAt = lastReadByConversation.get(conversation.id)

        // Dernier message visible
        const lastMessageQuery = Message.query().where('conversationId', conversation.id)

        if (clearedAt) {
          lastMessageQuery.where('createdAt', '>=', clearedAt.toJSDate())
        }

        const lastMessage = await lastMessageQuery
          .orderBy('createdAt', 'desc')
          .orderBy('id', 'desc')
          .first()

        // Messages non lus
        const unreadQuery = Message.query()
          .where('conversationId', conversation.id)
          .whereNot('authorId', userId)

        if (clearedAt) {
          unreadQuery.where('createdAt', '>=', clearedAt.toJSDate())
        }

        if (lastReadAt) {
          unreadQuery.where('createdAt', '>', lastReadAt.toJSDate())
        }

        const unreadResult = await unreadQuery.count('* as total').first()
        const unreadCount = Number(unreadResult?.$extras.total ?? 0)

        const base = {
          ...result,
          lastMessage: lastMessage?.serialize() ?? null,
          unreadCount,
          favorite: favoriteByConversation.get(conversation.id) ?? false,
        }

        // Conversation de groupe : on renvoie les infos du groupe
        if (conversation.groupId) {
          const group = await Group.find(conversation.groupId)

          return {
            ...base,
            otherUser: null,
            group: group
              ? {
                  id: group.id,
                  name: group.name,
                  description: group.description,
                }
              : null,
          }
        }

        // Identifier l'autre participant
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

        return { ...base, otherUser }
      })
    )

    return response.ok({ data })
  }

  /**
   * Afficher une conversation précise et la marquer comme lue
   */
  async show({ params, session, response }: HttpContext) {
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

    // Vérifier que l'utilisateur participe à cette conversation
    const membership = await Membership.query()
      .where('userId', userId)
      .where('conversationId', conversationId)
      .first()

    if (!membership) {
      return response.notFound({
        message: 'Conversation introuvable.',
      })
    }

    const conversation = await Conversation.find(conversationId)

    if (!conversation) {
      return response.notFound({
        message: 'Conversation introuvable.',
      })
    }

    // Déplacer le marque-page : tout ce qui précède est maintenant lu
    await Membership.query()
      .where('userId', userId)
      .where('conversationId', conversationId)
      .update({ last_read_at: new Date() })

    return response.ok({
      data: conversation,
    })
  }


    /**
   * Ajouter ou retirer une conversation des favoris
   */
  async toggleFavorite({ params, session, response }: HttpContext) {
    const userId = Number(session.get('userId'))

    if (!userId) {
      return response.unauthorized({ message: 'Vous devez être connecté.' })
    }

    const conversationId = Number(params.id)

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return response.badRequest({ message: 'Identifiant de conversation invalide.' })
    }

    const membership = await Membership.query()
      .where('userId', userId)
      .where('conversationId', conversationId)
      .first()

    if (!membership) {
      return response.notFound({ message: 'Conversation introuvable.' })
    }

    const favorite = !membership.isFavorite

    await Membership.query()
      .where('userId', userId)
      .where('conversationId', conversationId)
      .update({ is_favorite: favorite })

    return response.ok({ data: { favorite } })
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

    const deleted = await Membership.query()
      .where('userId', userId)
      .where('conversationId', conversationId)
      .delete()

    if (!deleted || deleted[0] === 0) {
      return response.notFound({
        message: 'Conversation introuvable.',
      })
    }

    return response.ok({
      message: 'Conversation supprimée de votre liste.',
    })
  }
}