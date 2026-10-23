
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class ProfilesController {
  /**
   * Afficher le profil de l'utilisateur connecté
   */
  async show({ session, response, view }: HttpContext) {
    const userId = session.get('userId')

    if (!userId) {
      return response.redirect('/login')
    }

    const user = await User.find(userId)

    if (!user) {
      session.forget('userId')
      return response.redirect('/login')
    }

    return view.render('pages/chat/profile', {
      user,
    })
  }

  /**
   * Modifier les informations du profil
   */
  async update({ session, request, response }: HttpContext) {
    const userId = session.get('userId')

    if (!userId) {
      return response.unauthorized({
        message: 'Vous devez être connecté pour modifier votre profil.',
      })
    }

    const user = await User.find(userId)

    if (!user) {
      return response.notFound({
        message: 'Utilisateur introuvable.',
      })
    }

    const fullName = request.input('fullName')
    const username = request.input('username')
    const bio = request.input('bio')

    // Vérifier le nom complet
    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      return response.badRequest({
        message: 'Le nom complet doit contenir au moins 2 caractères.',
      })
    }

    // Vérifier le nom d'utilisateur
    if (typeof username !== 'string' || username.trim().length < 3) {
      return response.badRequest({
        message: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
      })
    }

    const cleanUsername = username.trim()

    // Vérifier si le nom d'utilisateur est déjà utilisé
    const existingUser = await User.query()
      .where('username', cleanUsername)
      .whereNot('id', user.id)
      .first()

    if (existingUser) {
      return response.badRequest({
        message: "Ce nom d'utilisateur est déjà utilisé.",
      })
    }

    // Vérifier la biographie
    if (
      bio !== undefined &&
      bio !== null &&
      typeof bio !== 'string'
    ) {
      return response.badRequest({
        message: 'La biographie est invalide.',
      })
    }

    // Mettre à jour les informations du profil
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

  /**
   * Modifier le mot de passe de l'utilisateur connecté
   */
  async changePassword({ session, request, response }: HttpContext) {
    const userId = session.get('userId')

    if (!userId) {
      return response.unauthorized({
        message: 'Vous devez être connecté pour modifier votre mot de passe.',
      })
    }

    const user = await User.find(userId)

    if (!user) {
      session.forget('userId')

      return response.unauthorized({
        message: 'Utilisateur introuvable. Veuillez vous reconnecter.',
      })
    }

    const currentPassword = request.input('currentPassword')
    const newPassword = request.input('newPassword')
    const confirmPassword = request.input('confirmPassword')

    // Vérifier les champs obligatoires
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

    // Vérifier la robustesse du nouveau mot de passe
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

    // Vérifier la confirmation du nouveau mot de passe
    if (newPassword !== confirmPassword) {
      return response.badRequest({
        message: 'Les deux nouveaux mots de passe ne correspondent pas.',
      })
    }

    // Vérifier le mot de passe actuel
    const currentPasswordIsValid = await hash.verify(
      user.password,
      currentPassword
    )

    if (!currentPasswordIsValid) {
      return response.badRequest({
        message: 'Votre mot de passe actuel est incorrect.',
      })
    }

    // Empêcher de réutiliser le mot de passe actuel
    const samePassword = await hash.verify(user.password, newPassword)

    if (samePassword) {
      return response.badRequest({
        message: 'Votre nouveau mot de passe doit être différent de l’ancien.',
      })
    }

    /*
     * Enregistrer le nouveau mot de passe.
     * Le mécanisme de hachage automatique doit être confirmé
     * avant de considérer cette fonctionnalité comme terminée.
     */
    user.password = newPassword
    await user.save()

    return response.ok({
      message: 'Votre mot de passe a été modifié avec succès.',
    })
  }
}
