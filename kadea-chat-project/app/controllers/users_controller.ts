import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  async index({ auth, response }: HttpContext) {
    const userId = auth.user!.id

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
