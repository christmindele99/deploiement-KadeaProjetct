import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SessionAuthMiddleware {
  async handle({ session, response }: HttpContext, next: NextFn) {
    const userId = session.get('userId')
    if (!userId) {
      return response.redirect('/login')
    }

    return next()
  }
}
