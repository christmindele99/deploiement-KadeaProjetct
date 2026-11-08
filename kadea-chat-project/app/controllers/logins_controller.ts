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
  async show({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  async store({ request, response, session }: HttpContext) {
    const { emailOrUsername, password } = await request.validateUsing(loginValidator)
    const identifier = emailOrUsername.trim()

    const user = await User.query()
      .whereRaw('LOWER(email) = LOWER(?)', [identifier])
      .orWhereRaw('LOWER(username) = LOWER(?)', [identifier])
      .first()

    if (!user) {
      session.flash('errors.form', 'E-mail, nom d’utilisateur ou mot de passe incorrect.')
      session.flash('emailOrUsername', identifier)

      return response.redirect().toRoute('login.show')
    }

    const passwordIsValid = await hash.verify(user.password, password)

    if (!passwordIsValid) {
      session.flash('errors.form', 'E-mail, nom d’utilisateur ou mot de passe incorrect.')
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

      const token = crypto.randomBytes(32).toString('hex')

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

      await UserToken.create({
        userId: user.id,
        type: 'email_verification',
        tokenHash,
        expiresAt: DateTime.now().plus({ hours: 24 }),
      })

      const verificationUrl = `${env.get('APP_URL')}/verify-email/${token}`

      await mail.send((message) => {
        message.to(user.email).subject('Confirmez votre adresse e-mail - Kadea Chat').html(`
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

      session.put('verification_email', user.email)

      return response.redirect('/verify-email')
    }

    // 7. Enregistrer l'identifiant de l'utilisateur dans la session
    session.put('userId', user.id)

    // 8. Rediriger vers le chat
    return response.redirect().toRoute('chat.index')
  }
}
