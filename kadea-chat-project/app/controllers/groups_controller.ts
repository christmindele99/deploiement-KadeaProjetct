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

    async show({ params, session, response }: HttpContext) {
    const userId = Number(session.get('userId'))

    if (!userId) {
      return response.unauthorized({ message: 'Vous devez être connecté.' })
    }

    const conversationId = Number(params.id)

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return response.badRequest({ message: 'Identifiant de conversation invalide.' })
    }

    // Seuls les membres du groupe peuvent voir ses infos
    const myMembership = await Membership.query()
      .where('userId', userId)
      .where('conversationId', conversationId)
      .first()

    if (!myMembership) {
      return response.notFound({ message: 'Groupe introuvable.' })
    }

    const conversation = await Conversation.find(conversationId)

    if (!conversation || !conversation.groupId) {
      return response.notFound({ message: 'Groupe introuvable.' })
    }

    const group = await Group.find(conversation.groupId)

    if (!group) {
      return response.notFound({ message: 'Groupe introuvable.' })
    }

    const memberships = await Membership.query().where('conversationId', conversationId)

    const users = await User.query().whereIn(
      'id',
      memberships.map((membership) => membership.userId)
    )

    const usersById = new Map(users.map((user) => [user.id, user]))

    const members = memberships.flatMap((membership) => {
      const user = usersById.get(membership.userId)

      if (!user) {
        return []
      }

      return [
        {
          id: user.id,
          fullName: user.fullName ?? user.username,
          username: user.username,
          avatar: user.avatar,
          roleId: membership.roleId,
          role: membership.roleId === 1 ? 'admin' : 'member',
        },
      ]
    })

    return response.ok({
      data: {
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
        },
        myRole: myMembership.roleId === 1 ? 'admin' : 'member',
        members,
      },
    })
  }

    async update({ params, session, request, response }: HttpContext) {
    const userId = Number(session.get('userId'))

    if (!userId) {
      return response.unauthorized({ message: 'Vous devez être connecté.' })
    }

    const conversationId = Number(params.id)

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return response.badRequest({ message: 'Identifiant de conversation invalide.' })
    }

    const myMembership = await Membership.query()
      .where('userId', userId)
      .where('conversationId', conversationId)
      .first()

    if (!myMembership) {
      return response.notFound({ message: 'Groupe introuvable.' })
    }

    // Seuls les admins (roleId 1) peuvent modifier le groupe
    if (myMembership.roleId !== 1) {
      return response.forbidden({
        message: 'Seuls les admins peuvent modifier le groupe.',
      })
    }

    const conversation = await Conversation.find(conversationId)

    if (!conversation || !conversation.groupId) {
      return response.notFound({ message: 'Groupe introuvable.' })
    }

    const group = await Group.find(conversation.groupId)

    if (!group) {
      return response.notFound({ message: 'Groupe introuvable.' })
    }

    const name = String(request.input('name', '')).trim()
    const rawDescription = request.input('description')
    const description =
      typeof rawDescription === 'string' && rawDescription.trim()
        ? rawDescription.trim()
        : null

    if (name.length < 2 || name.length > 100) {
      return response.badRequest({
        message: 'Le nom du groupe doit contenir entre 2 et 100 caractères.',
      })
    }

    if (description && description.length > 255) {
      return response.badRequest({
        message: 'La description ne doit pas dépasser 255 caractères.',
      })
    }

    group.name = name
    group.description = description
    await group.save()

    // Prévenir tous les membres pour que leur liste se mette à jour
    const memberships = await Membership.query().where('conversationId', conversationId)

    for (const membership of memberships) {
      transmit.broadcast(`users/${membership.userId}`, {
        event: 'user.notification',
        data: { conversationId },
      })
    }

    return response.ok({
      message: 'Groupe mis à jour.',
      data: {
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
        },
      },
    })
  }
}