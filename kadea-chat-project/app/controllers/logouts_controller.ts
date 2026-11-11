import type { HttpContext } from '@adonisjs/core/http'

export default class LogoutsController {
  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()

    return response.ok({
      message: 'Déconnexion réussie.',
      redirectTo: '/login',
    })
  }
}
