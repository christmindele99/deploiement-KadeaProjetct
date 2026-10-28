import type { HttpContext } from '@adonisjs/core/http'
import Comment from '#models/comment'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

export default class CommentsController {
  async store({ session, request, response }: HttpContext) {
    const userId = session.get('userId')

    if (!userId) {
      return response.status(401).json({
        message: 'Vous devez être connecté pour envoyer un commentaire.',
      })
    }

    const rating = Number(request.input('rating'))
    const content = String(request.input('comment') ?? '').trim()

    if (!Number.isInteger(rating) || rating < 1 || rating > 6) {
      return response.status(422).json({
        message: 'Veuillez choisir une note entre 1 et 6 étoiles.',
      })
    }

    if (content.length < 3 || content.length > 1000) {
      return response.status(422).json({
        message: 'Le commentaire doit contenir entre 3 et 1000 caractères.',
      })
    }
    await Comment.create({ userId, rating, content })
        try {
        const user = await User.find(userId)

        await mail.send((message) => {
            message
            .to(env.get('MAIL_FROM_ADDRESS'))
            .subject(`Nouveau commentaire Kadea Chat (${rating}/6 étoiles)`)
            .text(
                `De : ${user?.fullName ?? 'Utilisateur inconnu'} (${user?.email ?? 'e-mail inconnu'})\n` +
                `Note : ${rating}/6\n\n${content}`
            )
        })
        } catch (error) {
        console.error("Impossible d'envoyer l'e-mail du commentaire :", error)
        }

    return response.status(201).json({
      message: 'Merci pour votre commentaire !',
    })
  }
}