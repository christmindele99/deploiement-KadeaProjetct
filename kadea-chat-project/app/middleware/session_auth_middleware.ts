
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SessionAuthMiddleware {
  async handle(
    { session, response }: HttpContext,
    next: NextFn
  ) {
    const userId = session.get('userId')

    console.log('SESSION COMPLÈTE :', session.all())
    console.log('USER ID DANS LE MIDDLEWARE :', userId)

    if (!userId) {
      return response.redirect('/login')
    }

    return next()
  }
}
