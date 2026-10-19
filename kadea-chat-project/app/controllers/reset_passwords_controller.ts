import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserToken from '#models/user_token'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

export default class ResetPasswordsController {
  /**
   * Recherche un token de réinitialisation valide
   */
  private async findValidToken(token: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    return UserToken.query()
      .where('tokenHash', tokenHash)
      .where('type', 'password_reset')
      .whereNull('usedAt')
      .where('expiresAt', '>', DateTime.now().toSQL()!)
      .first()
  }

  /**
   * Affiche le formulaire du nouveau mot de passe
   */
  async show({ params, view, response, session }: HttpContext) {
    const token = params.token

    // Vérifier le format du token
    if (
      typeof token !== 'string' ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      session.flash(
        'errors.form',
        'Ce lien de réinitialisation est invalide.'
      )

      return response.redirect().toRoute('forgot-password.show')
    }

    // Vérifier l'existence, l'expiration et l'utilisation du token
    const userToken = await this.findValidToken(token)

    if (!userToken) {
      session.flash(
        'errors.form',
        'Ce lien est expiré ou a déjà été utilisé. Demandez un nouveau lien.'
      )

      return response.redirect().toRoute('forgot-password.show')
    }

    return view.render('pages/auth/reset-password', { token })
  }

  /**
   * Enregistre le nouveau mot de passe
   */
  async store({
    params,
    request,
    response,
    session,
  }: HttpContext) {
    const token = params.token

    // 1. Vérifier le format du token
    if (
      typeof token !== 'string' ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      session.flash(
        'errors.form',
        'Ce lien de réinitialisation est invalide.'
      )

      return response.redirect().toRoute('forgot-password.show')
    }

    // 2. Vérifier que le token est valide
    const userToken = await this.findValidToken(token)

    if (!userToken) {
      session.flash(
        'errors.form',
        'Ce lien est expiré ou a déjà été utilisé. Demandez un nouveau lien.'
      )

      return response.redirect().toRoute('forgot-password.show')
    }

    // 3. Récupérer les champs du formulaire
    const password = request.input('password')
    const passwordConfirmation = request.input('passwordConfirmation')

    if (
      typeof password !== 'string' ||
      typeof passwordConfirmation !== 'string' ||
      !password ||
      !passwordConfirmation
    ) {
      session.flash(
        'errors.form',
        'Veuillez remplir les deux champs.'
      )

      return response.redirect().back()
    }

    // 4. Vérifier la robustesse du mot de passe
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

    if (!passwordRegex.test(password)) {
      session.flash(
        'errors.form',
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
      )

      return response.redirect().back()
    }

    // 5. Vérifier la confirmation du mot de passe
    if (password !== passwordConfirmation) {
      session.flash(
        'errors.form',
        'Les deux mots de passe ne correspondent pas.'
      )

      return response.redirect().back()
    }

    // 6. Retrouver l'utilisateur associé au token
    const user = await User.find(userToken.userId)

    if (!user) {
      session.flash(
        'errors.form',
        'Le compte associé à ce lien est introuvable.'
      )

      return response.redirect().toRoute('forgot-password.show')
    }

    // 7. Hacher et enregistrer le nouveau mot de passe
    user.password = password
    await user.save()

    // 8. Marquer le token actuel comme utilisé
    userToken.usedAt = DateTime.now()
    await userToken.save()

    // 9. Invalider les autres tokens de réinitialisation inutilisés
    await UserToken.query()
      .where('userId', user.id)
      .where('type', 'password_reset')
      .whereNull('usedAt')
      .update({
        usedAt: DateTime.now(),
      })

    // 10. Confirmer la réussite et rediriger vers la connexion
    session.flash(
      'success',
      'Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.'
    )

    return response.redirect().toRoute('login.show')
  }
}
