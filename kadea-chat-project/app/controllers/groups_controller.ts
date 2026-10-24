import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import transmit from '@adonisjs/transmit/services/main'
import { DateTime } from 'luxon'
import User from '#models/user'
import Group from '#models/group'
import Conversation from '#models/conversation'
import Membership from '#models/membership'

export default class GroupsController {
  async store({ session, request, response }: HttpContext) {
    const userId = Number(session.get('userId'))

    if (!userId) {
      return response.unauthorized({
        message: 'Vous devez être connecté pour créer un groupe.',
      })
    }

    const name = String(request.input('name', '')).trim()
    const rawDescription = request.input('description')
    const description =
      typeof rawDescription === 'string' && rawDescription.trim()
        ? rawDescription.trim()
        : null
    const rawMemberIds = request.input('memberIds')

    if (name.length < 2 || name.length > 100) {
      return response.badRequest({
        message: 'Le nom du groupe doit contenir entre 2 et 100 caractères.',
      })
    }

    if (!Array.isArray(rawMemberIds)) {
      return response.badRequest({ message: 'La liste des membres est invalide.' })
    }

    const memberIds = [
      ...new Set(
        rawMemberIds
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0 && id !== userId)
      ),
    ]

    if (memberIds.length < 1) {
      return response.badRequest({
        message: 'Sélectionne au moins un membre.',
      })
    }

    const existingUsers = await User.query().whereIn('id', memberIds)

    if (existingUsers.length !== memberIds.length) {
      return response.badRequest({
        message: 'Certains utilisateurs sélectionnés sont introuvables.',
      })
    }

    const conversation = await db.transaction(async (trx) => {
      const group = await Group.create({ name, description }, { client: trx })

      const newConversation = await Conversation.create(
        { groupId: group.id },
        { client: trx }
      )

      const now = DateTime.now()

      await Membership.createMany(
        [
          // Le créateur est admin (role 1)
          {
            userId,
            conversationId: newConversation.id,
            roleId: 1,
            joinedAt: now,
            isFavorite: false,
          },
          // Les autres sont member (role 2)
          ...memberIds.map((id) => ({
            userId: id,
            conversationId: newConversation.id,
            roleId: 2,
            joinedAt: now,
            isFavorite: false,
          })),
        ],
        { client: trx }
      )

      return newConversation
    })

    // Prévenir les membres en temps réel pour que le groupe apparaisse chez eux
    for (const id of memberIds) {
      transmit.broadcast(`users/${id}`, {
        event: 'user.notification',
        data: { conversationId: conversation.id },
      })
    }

    return response.created({
      message: 'Groupe créé avec succès.',
      data: { conversationId: conversation.id, groupId: conversation.groupId },
    })
  }
}