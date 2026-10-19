import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import env from '#start/env'
import mail from '@adonisjs/mail/services/main'
import User from '#models/user'
import UserToken from '#models/user_token'

export default class VerifyEmailController {
  /**
   * Affiche la page demandant de vérifier l'adresse e-mail.
   */
  async show({ view, session }: HttpContext) {
    const email = session.get('verification_email')

    return view.render('pages/auth/verify-email', {
      email,
    })
  }

  /**
   * Renvoie un nouveau lien de confirmation.
   */
  async resend({ session, response }: HttpContext) {
    const email = session.get('verification_email')

    if (!email) {
      session.flash(
        'error',
        'Votre adresse e-mail est introuvable. Veuillez recommencer votre inscription.'
      )

      return response.redirect().toRoute('register.show')
    }

    const user = await User.findBy('email', email)

    if (!user) {
      session.flash(
        'error',
        'Impossible de retrouver ce compte. Veuillez recommencer votre inscription.'
      )

      return response.redirect().toRoute('verify-email.show')
    }

    // Si l'adresse est déjà confirmée, aucun nouveau lien n'est nécessaire.
    if (user.emailVerifiedAt) {
      session.flash(
        'success',
        'Votre adresse e-mail est déjà confirmée. Vous pouvez vous connecter.'
      )

      return response.redirect().toRoute('login.show')
    }

    // Invalider les anciens liens de confirmation encore inutilisés.
    await UserToken.query()
      .where('userId', user.id)
      .where('type', 'email_verification')
      .whereNull('usedAt')
      .update({
        usedAt: DateTime.now().toSQL(),
      })

    // Générer un nouveau jeton aléatoire.
    const token = crypto.randomBytes(32).toString('hex')

    // Seul le hash du jeton est enregistré en base de données.
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    await UserToken.create({
      userId: user.id,
      type: 'email_verification',
      tokenHash,
      expiresAt: DateTime.now().plus({ hours: 24 }),
      usedAt: null,
    })

    // Construire le lien de confirmation.
    const appUrl = env.get('APP_URL').replace(/\/$/, '')
    const verificationUrl = `${appUrl}/verify-email/${token}`

    try {
      // Envoyer le nouveau lien par e-mail.
      await mail.send((message) => {
        message
          .to(user.email)
          .subject('Confirmez votre adresse e-mail - Kadea Chat')
          .html(`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #075e8d;">Bienvenue sur Kadea Chat !</h2>

              <p>Vous avez demandé un nouveau lien de confirmation pour votre adresse e-mail.</p>

              <p style="margin: 28px 0;">
                <a
                  href="${verificationUrl}"
                  style="background-color: #29ff9d; color: #000000; padding: 14px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;"
                >
                  Confirmer mon adresse e-mail
                </a>
              </p>

              <p>Ce lien est valable pendant 24 heures et remplace les précédents liens de confirmation inutilisés.</p>

              <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>

              <p style="color: #666; font-size: 12px;">Kadea Chat</p>
            </div>
          `)
      })
    } catch (error) {
      // Invalider le jeton si l'envoi du message échoue.
      await UserToken.query()
        .where('tokenHash', tokenHash)
        .where('type', 'email_verification')
        .whereNull('usedAt')
        .update({
          usedAt: DateTime.now().toSQL(),
        })

      console.error('Erreur lors du renvoi du lien de confirmation :', error)

      session.flash(
        'error',
        'Impossible d’envoyer l’e-mail pour le moment. Veuillez réessayer.'
      )

      return response.redirect().toRoute('verify-email.show')
    }

    session.flash(
      'success',
      'Un nouveau lien de confirmation vient d’être envoyé à votre adresse e-mail.'
    )

    return response.redirect().toRoute('verify-email.show')
  }

  /**
   * Confirme l'adresse e-mail à partir du jeton reçu.
   */
  async confirm({ params, response, view }: HttpContext) {
    const { token } = params

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const userToken = await UserToken.query()
      .where('tokenHash', tokenHash)
      .where('type', 'email_verification')
      .first()

    if (!userToken) {
      return response.status(400).send(
        'Ce lien de vérification est invalide ou a déjà été utilisé.'
      )
    }

    if (userToken.usedAt) {
      return response.status(400).send(
        'Ce lien de vérification a déjà été utilisé.'
      )
    }

    if (userToken.expiresAt.toMillis() <= DateTime.now().toMillis()) {
      return response.status(400).send(
        'Ce lien de vérification a expiré. Veuillez demander un nouveau lien.'
      )
    }

    const user = await User.find(userToken.userId)

    if (!user) {
      return response.status(400).send(
        'Impossible de retrouver le compte associé à ce lien.'
      )
    }

    if (!user.emailVerifiedAt) {
      user.emailVerifiedAt = DateTime.now()
      await user.save()
    }

    userToken.usedAt = DateTime.now()
    await userToken.save()

    return view.render('pages/auth/email-verified', {
      email: user.email,
    })
  }
}
