import type { HttpContext } from '@adonisjs/core/http'

export default class LogoutsController {
  async destroy({ session, response }: HttpContext) {
    // Supprimer toutes les données de la session
    session.clear()

    // Régénérer l'identifiant de session pour invalider l'ancien
    session.regenerate()

    // Le navigateur sera redirigé vers la page de connexion
    return response.ok({
      message: 'Déconnexion réussie.',
      redirectTo: '/login',
    })
  }
}
