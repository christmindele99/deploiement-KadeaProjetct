import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserToken from '#models/user_token'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

export default class ForgotPasswordsController {
  /**
   * Affiche le formulaire de mot de passe oublié
   */
  async show({ view }: HttpContext) {
    return view.render('pages/auth/forgot-password')
  }

  /**
   * Traite la demande de réinitialisation du mot de passe
   */
  async store({ request, response, session }: HttpContext) {
    const wantsJson =
    request.header('accept')?.includes('application/json') ?? false
    const email = request.input('email')
    console.log('EMAIL REÇU :', email)
  console.log('BODY REÇU :', request.all())

    // 1. Vérifier l'adresse e-mail
    if (typeof email !== 'string' || !email.trim()) {
      const message = 'Veuillez saisir une adresse e-mail valide.'

      if (wantsJson) {
        return response.badRequest({ message })
      }

      session.flash('errors.form', message)
      return response.redirect().back()
    }

    const normalizedEmail = email.trim()

    // 2. Rechercher l'utilisateur
    const user = await User.findBy('email', normalizedEmail)

    // Ne pas révéler si un compte existe
    const successMessage =
      'Si cette adresse correspond à un compte, un lien de réinitialisation sera envoyé.'

    if (!user) {
      if (wantsJson) {
        return response.ok({ message: successMessage })
      }

      session.flash('success', successMessage)
      return response.redirect().back()
    }

    // 3. Invalider les anciens tokens de réinitialisation inutilisés
    await UserToken.query()
      .where('userId', user.id)
      .where('type', 'password_reset')
      .whereNull('usedAt')
      .update({
        usedAt: DateTime.now(),
      })

    // 4. Générer un token sécurisé
    const token = crypto.randomBytes(32).toString('hex')

    // Stocker uniquement le hash du token en base de données
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    // 5. Enregistrer le token avec une expiration d'une heure
    await UserToken.create({
      userId: user.id,
      type: 'password_reset',
      tokenHash,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    // 6. Construire le lien de réinitialisation
    const resetUrl =
      `${env.get('APP_URL')}/reset-password/${token}`

    // 7. Envoyer l'e-mail
    try {
      await mail.send((message) => {
        message
          .to(user.email)
          .subject('Réinitialisation du mot de passe - Kadea Chat')
          .html(`
            <!DOCTYPE html>
            <html lang="fr">
              <head>
                <meta charset="UTF-8">
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1.0"
                >
                <title>Réinitialisation du mot de passe</title>
              </head>

              <body style="margin:0;padding:0;font-family:Arial,sans-serif;color:#000000;background-color:#ffffff;">
                <div style="max-width:600px;margin:30px auto;padding:24px;">
                  <h1 style="color:#075e8d;">
                    Réinitialisez votre mot de passe
                  </h1>

                  <p>Bonjour,</p>

                  <p>
                    Vous avez demandé la réinitialisation de votre mot
                    de passe Kadea Chat.
                  </p>

                  <p style="margin:32px 0;">
                    <a
                      href="${resetUrl}"
                      style="display:inline-block;background:#29ff9d;color:#075e8d;padding:14px 24px;text-decoration:none;border-radius:6px;font-weight:bold;"
                    >
                      Réinitialiser mon mot de passe
                    </a>
                  </p>

                  <p>
                    Ce lien expire dans une heure.
                  </p>

                  <p>
                    Si vous n'avez pas effectué cette demande,
                    ignorez cet e-mail.
                  </p>

                  <p>L'équipe Kadea Chat</p>
                </div>
              </body>
            </html>
          `)
      })
    } catch (error) {
      // 8. Invalider le token si l'envoi de l'e-mail échoue
      await UserToken.query()
        .where('userId', user.id)
        .where('tokenHash', tokenHash)
        .whereNull('usedAt')
        .update({
          usedAt: DateTime.now(),
        })

      console.error('Échec de l’envoi du mail :', error)
      const message = 'Impossible d’envoyer l’e-mail. Réessayez plus tard.'
      if (wantsJson) {
        return response.internalServerError({ message })
      }
      session.flash('errors.form', message)
      return response.redirect().back()
    }

    // 9. Confirmer la demande
    if (wantsJson) {
      return response.ok({ message: successMessage })
    }
    session.flash('success', successMessage)
    return response.redirect().back()
  }
}
