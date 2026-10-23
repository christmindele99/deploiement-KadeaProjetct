import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import transmit from '@adonisjs/transmit/services/main'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import Conversation from '#models/conversation'
import Membership from '#models/membership'
import Message from '#models/message'
import User from '#models/user'

export default class MessagesController {
  /**
   * Publier un événement sur le canal d'une conversation.
   * Le champ message assure la compatibilité avec le client actuel.
   */
  private async broadcastConversation(
    conversationId: number,
    type: string,
    data: Record<string, any>
  ) {
    await transmit.broadcast(
      `conversations/${conversationId}/messages`,
      {
        type,
        data,
        message: data,
      }
    )
  }

  /**
   * Notifier les utilisateurs membres d'une conversation.
   * Utile lorsqu'un utilisateur n'est pas encore abonné
   * au canal de cette conversation.
   */
  private async notifyMembers(
    conversationId: number,
    type: string,
    data: Record<string, any>
  ) {
    const memberships = await Membership.query()
      .where('conversationId', conversationId)

    const userIds = [
      ...new Set(
        memberships.map((membership) =>
          Number(membership.userId)
        )
      ),
    ]

    await Promise.all(
      userIds.map(async (userId) => {
        await transmit.broadcast(`users/${userId}`, {
          type: 'message',
          event: type,
          message: data,
          data,
        })
      })
    )
  }

  /**
   * Publier un événement sans annuler une opération
   * en base de données déjà validée si Transmit échoue.
   */
  private async publish(
    conversationId: number,
    type: string,
    data: Record<string, any>,
    notifyUsers = true
  ) {
    try {
      await this.broadcastConversation(
        conversationId,
        type,
        data
      )

      if (notifyUsers) {
        await this.notifyMembers(
          conversationId,
          type,
          data
        )
      }
    } catch (error) {
      console.error(
        'Kadea Chat : erreur de diffusion temps réel.',
        error
      )
    }
  }


    /**
   * Recréer la participation d'un utilisateur qui a supprimé
   * une conversation privée de sa liste.
   */
  private async restorePairMemberships(
    conversation: Conversation,
    trx: TransactionClientContract
  ) {
    if (conversation.groupId || !conversation.pairKey) {
      return
    }

    const userIds = conversation.pairKey
      .split(':')
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0)

    for (const memberId of userIds) {
      const membership = await Membership.query({ client: trx })
        .where('userId', memberId)
        .where('conversationId', conversation.id)
        .first()

      if (!membership) {
        await Membership.create(
          {
            userId: memberId,
            conversationId: conversation.id,
            roleId: 2,
            clearedAt: DateTime.now(),
          },
          { client: trx }
        )
      }
    }
  }

  /**
   * Récupérer les messages d'une conversation.
   */
  async index({ params, session, response }: HttpContext) {
    const userId = Number(session.get('userId'))
    const conversationId = Number(params.id)

    if (!userId) {
      return response.unauthorized({
        message: 'Vous devez être connecté.',
      })
    }

    if (
      !Number.isInteger(conversationId) ||
      conversationId <= 0
    ) {
      return response.badRequest({
        message: 'Identifiant de conversation invalide.',
      })
    }

    const membership = await Membership.query()
      .where('userId', userId)
      .where('conversationId', conversationId)
      .first()

    if (!membership) {
      return response.notFound({
        message: 'Conversation introuvable.',
      })
    }

    const messagesQuery = Message.query()
      .where('conversationId', conversationId)

    if (membership.clearedAt) {
      messagesQuery.where('createdAt', '>=', membership.clearedAt.toJSDate())
    }
    const messages = await messagesQuery.orderBy('createdAt', 'asc')

    return response.ok({
      data: messages,
    })
  }

  /**
   * Envoyer un message.
   *
   * Crée une conversation privée si nécessaire,
   * puis diffuse le message après validation de la transaction.
   */
  async store({ params, request, session, response }: HttpContext) {
    const userId = Number(session.get('userId'))

    if (!userId) {
      return response.unauthorized({
        message: 'Vous devez être connecté.',
      })
    }

    const content = request.input('content')
    const recipientId = Number(request.input('recipientId'))
    const conversationId = Number(
      params.id ?? request.input('conversationId') ?? 0
    )

    if (typeof content !== 'string' || !content.trim()) {
      return response.badRequest({
        message: 'Le message ne peut pas être vide.',
      })
    }

    if (
      conversationId < 0 ||
      !Number.isInteger(conversationId)
    ) {
      return response.badRequest({
        message: 'Identifiant de conversation invalide.',
      })
    }

    try {
      const message = await db.transaction(async (trx) => {
        let conversation: Conversation

        if (conversationId > 0) {
          const membership = await Membership.query({ client: trx })
            .where('userId', userId)
            .where('conversationId', conversationId)
            .first()

          if (!membership) {
            throw new Error('CONVERSATION_NOT_FOUND')
          }

          const foundConversation = await Conversation.query({
            client: trx,
          })
            .where('id', conversationId)
            .first()

          if (!foundConversation) {
            throw new Error('CONVERSATION_NOT_FOUND')
          }
          conversation = foundConversation
          await this.restorePairMemberships(conversation, trx)
        } else {
          if (
            !Number.isInteger(recipientId) ||
            recipientId <= 0 ||
            recipientId === userId
          ) {
            throw new Error('INVALID_RECIPIENT')
          }

          const recipient = await User.find(recipientId, {
            client: trx,
          })

          if (!recipient || !recipient.emailVerifiedAt) {
            throw new Error('RECIPIENT_NOT_FOUND')
          }

          const pairKey = [userId, recipientId]
            .sort((a, b) => a - b)
            .join(':')

          const existingConversation = await Conversation.query({
            client: trx,
          })
            .where('pairKey', pairKey)
            .first()

          if (existingConversation) {
            conversation = existingConversation

            for (const memberId of [userId, recipientId]) {
              const membership = await Membership.query({
                client: trx,
              })
                .where('userId', memberId)
                .where('conversationId', conversation.id)
                .first()

              if (!membership) {
                await Membership.create(
                  {
                    userId: memberId,
                    conversationId: conversation.id,
                    roleId: 2,
                    clearedAt: DateTime.now(),
                  },
                  { client: trx }
                )
              }
            }
          } else {
            conversation = await Conversation.create(
              {
                groupId: null,
                pairKey,
              },
              { client: trx }
            )

            await Membership.createMany(
              [
                {
                  userId,
                  conversationId: conversation.id,
                  roleId: 2,
                },
                {
                  userId: recipientId,
                  conversationId: conversation.id,
                  roleId: 2,
                },
              ],
              { client: trx }
            )
          }
        }

        const senderMembership = await Membership.query({
          client: trx,
        })
          .where('userId', userId)
          .where('conversationId', conversation.id)
          .first()

        if (!senderMembership) {
          throw new Error('CONVERSATION_NOT_FOUND')
        }

        return Message.create(
          {
            authorId: userId,
            conversationId: conversation.id,
            content: content.trim(),
            deletedAt: null,
          },
          { client: trx }
        )
      })

      const data = message.serialize()

      await this.publish(
        Number(message.conversationId),
        'message.created',
        data
      )

      return response.created({
        data,
      })
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'CONVERSATION_NOT_FOUND'
      ) {
        return response.notFound({
          message: 'Conversation introuvable.',
        })
      }

      if (
        error instanceof Error &&
        error.message === 'INVALID_RECIPIENT'
      ) {
        return response.badRequest({
          message: 'Le destinataire est invalide.',
        })
      }

      if (
        error instanceof Error &&
        error.message === 'RECIPIENT_NOT_FOUND'
      ) {
        return response.notFound({
          message: 'Destinataire introuvable ou non vérifié.',
        })
      }

      throw error
    }
  }

  /**
   * Modifier uniquement ses propres messages.
   */
  async update({ params, request, session, response }: HttpContext) {
    const userId = Number(session.get('userId'))
    const messageId = Number(params.id)

    if (!userId) {
      return response.unauthorized({
        message: 'Vous devez être connecté.',
      })
    }

    if (!Number.isInteger(messageId) || messageId <= 0) {
      return response.badRequest({
        message: 'Identifiant de message invalide.',
      })
    }

    const content = request.input('content')

    if (typeof content !== 'string' || !content.trim()) {
      return response.badRequest({
        message: 'Le message ne peut pas être vide.',
      })
    }

    const message = await Message.query()
      .where('id', messageId)
      .where('authorId', userId)
      .whereNull('deletedAt')
      .first()

    if (!message) {
      return response.notFound({
        message: 'Message introuvable ou modification non autorisée.',
      })
    }

    message.content = content.trim()
    await message.save()

    const data = message.serialize()

    await this.publish(
      Number(message.conversationId),
      'message.updated',
      data
    )

    return response.ok({
      data,
    })
  }

  /**
   * Supprimer logiquement un message.
   */
  async destroy({ params, session, response }: HttpContext) {
    const userId = Number(session.get('userId'))
    const messageId = Number(params.id)

    if (!userId) {
      return response.unauthorized({
        message: 'Vous devez être connecté.',
      })
    }

    if (!Number.isInteger(messageId) || messageId <= 0) {
      return response.badRequest({
        message: 'Identifiant de message invalide.',
      })
    }

    const message = await Message.query()
      .where('id', messageId)
      .where('authorId', userId)
      .first()

    if (!message) {
      return response.notFound({
        message: 'Message introuvable ou suppression non autorisée.',
      })
    }

    const conversationId = Number(message.conversationId)

    if (message.deletedAt) {
      await message.delete()

      await this.publish(conversationId, 'message.deleted', {
        id: messageId,
        conversationId,
        removed: true,
      })

      return response.ok({
        message: 'Message retiré de la conversation.',
      })
    }

    message.content = null
    message.deletedAt = DateTime.now()

    await message.save()

    await this.publish(
      conversationId,
      'message.deleted',
      {
        id: message.id,
        conversationId,
        deletedAt: message.deletedAt.toISO(),
      }
    )

    return response.ok({
      message: 'Message supprimé.',
    })
  }
}
