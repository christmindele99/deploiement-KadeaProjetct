
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class ShareUserMiddleware {
  async handle({ auth, view }: HttpContext, next: NextFn) {
    const user = auth.user ?? null

    view.share({ user })

    return next()
  }
}
