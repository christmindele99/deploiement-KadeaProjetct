import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import CloudinaryService from '#services/cloudinary_service'

export default class ProfilesController {
  async show({ auth, view }: HttpContext) {
    const user = auth.user!

    return view.render('pages/chat/profile', {
      user,
    })
  }

  async update({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const fullName = request.input('fullName')
    const username = request.input('username')
    const bio = request.input('bio')

    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      return response.badRequest({
        message: 'Le nom complet doit contenir au moins 2 caractères.',
      })
    }

    if (typeof username !== 'string' || username.trim().length < 3) {
      return response.badRequest({
        message: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
      })
    }

    const cleanUsername = username.trim()

    const existingUser = await User.query()
      .where('username', cleanUsername)
      .whereNot('id', user.id)
      .first()

    if (existingUser) {
      return response.badRequest({
        message: "Ce nom d'utilisateur est déjà utilisé.",
      })
    }

    if (existingUser) {
      return response.badRequest({
        message: "Ce nom d'utilisateur est déjà utilisé.",
      })
    }

    if (bio !== undefined && bio !== null && typeof bio !== 'string') {
      return response.badRequest({
        message: 'La biographie est invalide.',
      })
    }

    user.fullName = fullName.trim()
    user.username = cleanUsername
    user.bio = typeof bio === 'string' ? bio.trim() : null

    await user.save()

    return response.ok({
      message: 'Votre profil a été mis à jour avec succès.',
      data: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    })
  }

  async updateAvatar({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const avatar = request.file('avatar', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!avatar) {
      return response.badRequest({ message: 'Aucune photo envoyée.' })
    }

    if (!avatar.isValid) {
      return response.badRequest({ message: avatar.errors[0].message })
    }

    const result = await CloudinaryService.uploadAvatar(avatar.tmpPath!, user.id)

    user.avatar = result.secure_url
    await user.save()

    return response.ok({
      message: 'Photo de profil mise à jour.',
      data: { avatar: user.avatar },
    })
  }

  async changePassword({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const currentPassword = request.input('currentPassword')
    const newPassword = request.input('newPassword')
    const confirmPassword = request.input('confirmPassword')

    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      typeof confirmPassword !== 'string' ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return response.badRequest({
        message: 'Veuillez remplir tous les champs.',
      })
    }

    const passwordIsValid =
      newPassword.length >= 8 &&
      /[a-z]/.test(newPassword) &&
      /[A-Z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword)

    if (!passwordIsValid) {
      return response.badRequest({
        message:
          'Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.',
      })
    }

    if (newPassword !== confirmPassword) {
      return response.badRequest({
        message: 'Les deux nouveaux mots de passe ne correspondent pas.',
      })
    }

    const currentPasswordIsValid = await hash.verify(user.password, currentPassword)

    if (!currentPasswordIsValid) {
      return response.badRequest({
        message: 'Votre mot de passe actuel est incorrect.',
      })
    }

    const samePassword = await hash.verify(user.password, newPassword)

    if (samePassword) {
      return response.badRequest({
        message: 'Votre nouveau mot de passe doit être différent de l’ancien.',
      })
    }

    user.password = newPassword
    await user.save()

    return response.ok({
      message: 'Votre mot de passe a été modifié avec succès.',
    })
  }
}
