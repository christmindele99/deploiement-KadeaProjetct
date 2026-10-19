
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  async index({ session, response }: HttpContext) {
    const userId = session.get('userId')

    if (!userId) {
      return response.unauthorized({
        message: 'Vous devez être connecté pour consulter les utilisateurs.',
      })
    }

    const users = await User.query()
      .whereNot('id', userId)
      .whereNotNull('emailVerifiedAt')
      .select(['id', 'fullName', 'username', 'avatar', 'bio'])
      .orderBy('fullName', 'asc')

    return response.ok({
      data: users,
    })
  }
}
