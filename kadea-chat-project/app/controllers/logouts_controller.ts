import type { HttpContext } from '@adonisjs/core/http'

export default class LogoutsController {
  async destroy({ session, response }: HttpContext) {
    // Supprimer toutes les données de la session
    session.clear()

    session.regenerate()

    return response.ok({
      message: 'Déconnexion réussie.',
      redirectTo: '/login',
    })
  }
}
