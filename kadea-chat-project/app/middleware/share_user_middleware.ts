import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'

export default class ShareUserMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const userId = ctx.session.get('userId')

    const user = userId ? await User.find(userId) : null

    ctx.view.share({ user })

    return next()
  }
}