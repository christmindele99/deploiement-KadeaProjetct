import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserToken from '#models/user_token'
import hash from '@adonisjs/core/services/hash'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import { loginValidator } from '#validators/auth'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

export default class LoginsController {
  /**
   * Affiche la page de connexion
   */
  async show({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  /**
   * Traite la connexion
   */
  async store({ request, response, session }: HttpContext) {
    // 1. Valider les données du formulaire
    const { emailOrUsername, password } =
      await request.validateUsing(loginValidator)

    const identifier = emailOrUsername.trim()

    // 2. Rechercher l'utilisateur par e-mail ou username
    const user = await User.query()
      .whereRaw('LOWER(email) = LOWER(?)', [identifier])
      .orWhereRaw('LOWER(username) = LOWER(?)', [identifier])
      .first()

    // 3. Vérifier que le compte existe
    if (!user) {
      session.flash(
        'errors.form',
        'E-mail, nom d’utilisateur ou mot de passe incorrect.'
      )
      session.flash('emailOrUsername', identifier)

      return response.redirect().toRoute('login.show')
    }

    // 4. Vérifier le mot de passe
    const passwordIsValid = await hash.verify(
      user.password,
      password
    )

    if (!passwordIsValid) {
      session.flash(
        'errors.form',
        'E-mail, nom d’utilisateur ou mot de passe incorrect.'
      )
      session.flash('emailOrUsername', identifier)

      return response.redirect().toRoute('login.show')
    }

    // 5. Vérifier si l'e-mail est confirmé
    if (!user.emailVerifiedAt) {
      // Invalider les anciens liens encore inutilisés
      await UserToken.query()
        .where('userId', user.id)
        .where('type', 'email_verification')
        .whereNull('usedAt')
        .update({
          usedAt: DateTime.now(),
        })

      // Générer un nouveau token sécurisé
      const token = crypto.randomBytes(32).toString('hex')

      // Stocker uniquement le hash du token
      const tokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')

      await UserToken.create({
        userId: user.id,
        type: 'email_verification',
        tokenHash,
        expiresAt: DateTime.now().plus({ hours: 24 }),
      })

      // Construire le lien de confirmation
      const verificationUrl =
        `${env.get('APP_URL')}/verify-email/${token}`

      // Envoyer un nouvel e-mail
      await mail.send((message) => {
        message
          .to(user.email)
          .subject('Confirmez votre adresse e-mail - Kadea Chat')
          .html(`
            <!DOCTYPE html>
            <html lang="fr">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirmation de votre adresse e-mail</title>
              </head>
              <body style="font-family: Arial, sans-serif; color: #000000;">
                <div style="max-width: 600px; margin: 30px auto; padding: 24px;">
                  <h1 style="color: #075e8d;">
                    Confirmez votre adresse e-mail
                  </h1>

                  <p>Bonjour ${user.fullName},</p>

                  <p>
                    Votre adresse e-mail n'est pas encore confirmée.
                    Cliquez sur le bouton ci-dessous pour confirmer
                    votre compte Kadea Chat.
                  </p>

                  <p style="margin: 32px 0;">
                    <a
                      href="${verificationUrl}"
                      style="display: inline-block; background-color: #29ff9d; color: #075e8d; padding: 14px 24px; text-decoration: none; border-radius: 6px;"
                    >
                      Confirmer mon adresse e-mail
                    </a>
                  </p>

                  <p>Ce lien est valable pendant 24 heures.</p>

                  <p>
                    Si vous n'avez pas demandé ce lien, ignorez ce message.
                  </p>

                  <p>L'équipe Kadea Chat</p>
                </div>
              </body>
            </html>
          `)
      })

      // Conserver l'e-mail pour la page de vérification
      session.put('verification_email', user.email)

      // IMPORTANT : ne pas ouvrir la session utilisateur
      return response.redirect('/verify-email')
    }

    // 6. L'e-mail est confirmé : ouvrir la session
    session.put('userId', user.id)
    console.log('USER ID CONNECTÉ :', user.id)
    console.log('SESSION APRÈS CONNEXION :', session.all())

    // 7. Rediriger vers le chat
    return response.redirect().toRoute('chat.index')
  }
}