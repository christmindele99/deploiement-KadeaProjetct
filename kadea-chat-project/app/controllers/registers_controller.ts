import type { HttpContext } from '@adonisjs/core/http'
import { registerValidator } from '#validators/auth'
import User from '#models/user'
import UserToken from '#models/user_token'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'

export default class RegistersController {
  async show({ view }: HttpContext) {
    return view.render('pages/auth/register')
  }

  async checkEmail({ request, response }: HttpContext) {
    const email = request.input('email')
    const user = await User.findBy('email', email)

    return response.json({ exists: !!user })
  }

  private async generateUniqueUsername(fullName: string): Promise<string> {
    const baseUsername = fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')

    let candidateUsername = baseUsername
    let isUnique = false

    while (!isUnique) {
      const existingUser = await User.findBy('username', candidateUsername)

      if (!existingUser) {
        isUnique = true
      } else {
        const randomNumber = Math.floor(Math.random() * 1000)
        candidateUsername = `${baseUsername}${randomNumber}`
      }
    }

    return candidateUsername
  }


async store({ request, response, session }: HttpContext) {
  // 1. Valider les données du formulaire
  const payload = await request.validateUsing(registerValidator)

  // 2. Générer un nom d'utilisateur unique
  const username = await this.generateUniqueUsername(payload.fullName)

  // 5. Créer le compte utilisateur
  const user = await User.create({
    fullName: payload.fullName,
    email: payload.email,
    username,
    password: payload.password,
  })

  // 8. Générer un token de vérification sécurisé
  const token = crypto.randomBytes(32).toString('hex')

  // 9. Enregistrer le hash du token dans la base de données
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  await UserToken.create({
    userId: user.id,
    type: 'email_verification',
    tokenHash,
    expiresAt: DateTime.now().plus({ hours: 24 }),
  })

  // 10. Construire le lien de vérification
  const verificationUrl = `${env.get('APP_URL')}/verify-email/${token}`

  // 11. Envoyer l'e-mail de vérification
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
            <title>Vérification de votre adresse e-mail</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #000000;">
            <div style="max-width: 600px; margin: 30px auto; padding: 24px;">
              <h1 style="color: #075e8d;">Bienvenue sur Kadea Chat !</h1>

              <p>Bonjour ${user.fullName},</p>

              <p>
                Merci pour votre inscription sur Kadea Chat.
                Pour confirmer votre adresse e-mail et activer votre compte,
                cliquez sur le bouton ci-dessous.
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
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
              </p>

              <p style="overflow-wrap: anywhere;">
                <a href="${verificationUrl}" style="color: #075e8d;">
                  ${verificationUrl}
                </a>
              </p>

              <p>Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.</p>

              <p style="margin-top: 32px;">
                L'équipe Kadea Chat
              </p>
            </div>
          </body>
        </html>
      `)
  })

  // 12. Conserver l'adresse e-mail pour l'écran d'attente
  session.put('verification_email', user.email)

  // 13. Rediriger vers la page de vérification
  return response.redirect('/verify-email')
}
}
