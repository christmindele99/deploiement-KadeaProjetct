import transmit from '@adonisjs/transmit/services/main'
import Conversation from '#models/conversation'
import Membership from '#models/membership'
import Message from '#models/message'

export const MESSAGE_STATUS = { SENT: 1, RECEIVED: 2, READ: 3 } as const

type StatusRow = { id: number; authorId: number; conversationId: number }

export default class MessageStatusService {
  private static async notifyAuthors(rows: StatusRow[], statusId: number) {
    const groups = new Map<string, { authorId: number; conversationId: number; ids: number[] }>()

    for (const row of rows) {
      const key = `${row.authorId}:${row.conversationId}`
      const group = groups.get(key) ?? {
        authorId: row.authorId,
        conversationId: row.conversationId,
        ids: [],
      }

      group.ids.push(row.id)
      groups.set(key, group)
    }

    for (const group of groups.values()) {
      try {
        await transmit.broadcast(`users/${group.authorId}`, {
          type: 'message.status',
          event: 'message.status',
          data: {
            conversationId: group.conversationId,
            messageIds: group.ids,
            statusId,
          },
        })
      } catch (error) {
        console.error('Kadea Chat : erreur de diffusion du statut.', error)
      }
    }
  }

  // Un utilisateur vient de se connecter : ses messages "Envoyé" deviennent "Reçu"
  static async markReceivedFor(userId: number) {
    const memberships = await Membership.query().where('userId', userId)
    const conversationIds = memberships.map((membership) => membership.conversationId)

    if (!conversationIds.length) return

    const privateConversations = await Conversation.query()
      .whereIn('id', conversationIds)
      .whereNull('groupId')
      .select('id')

    const privateIds = privateConversations.map((conversation) => conversation.id)

    if (!privateIds.length) return

    const pending = await Message.query()
      .whereIn('conversationId', privateIds)
      .whereNot('authorId', userId)
      .where('messageStatusId', MESSAGE_STATUS.SENT)
      .select('id', 'authorId', 'conversationId')

    if (!pending.length) return

    await Message.query()
      .whereIn(
        'id',
        pending.map((message) => message.id)
      )
      .update({ message_status_id: MESSAGE_STATUS.RECEIVED })

    await this.notifyAuthors(
      pending.map((message) => ({
        id: message.id,
        authorId: message.authorId,
        conversationId: message.conversationId,
      })),
      MESSAGE_STATUS.RECEIVED
    )
  }

  // L'utilisateur ouvre la conversation : les messages de l'autre deviennent "Lu"
  static async markReadIn(conversationId: number, userId: number) {
    const conversation = await Conversation.find(conversationId)

    if (!conversation || conversation.groupId) return

    const pending = await Message.query()
      .where('conversationId', conversationId)
      .whereNot('authorId', userId)
      .whereNot('messageStatusId', MESSAGE_STATUS.READ)
      .select('id', 'authorId', 'conversationId')

    if (!pending.length) return

    await Message.query()
      .whereIn(
        'id',
        pending.map((message) => message.id)
      )
      .update({ message_status_id: MESSAGE_STATUS.READ })

    await this.notifyAuthors(
      pending.map((message) => ({
        id: message.id,
        authorId: message.authorId,
        conversationId: message.conversationId,
      })),
      MESSAGE_STATUS.READ
    )
  }
}
