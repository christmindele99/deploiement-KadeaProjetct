import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
import { middleware } from '#start/kernel'

transmit.registerRoutes()

router.get('/', ({ response }) => {
  return response.redirect().toRoute('register.show')
})

const ConversationsController = () => import('#controllers/conversations_controller')
const RegistersController = () => import('#controllers/registers_controller')
const VerifyEmailController = () => import('#controllers/verify_emails_controller')
const LoginsController = () => import('#controllers/logins_controller')
const ForgotPasswordsController = () => import('#controllers/forgot_passwords_controller')
const ResetPasswordsController = () => import('#controllers/reset_passwords_controller')
const UsersController = () => import('#controllers/users_controller')
const MessagesController = () => import('#controllers/messages_controller')
const ProfilesController = () => import('#controllers/profiles_controller')


// Afficher le formulaire d'inscription
router
  .get('/register', [RegistersController, 'show'])
  .as('register.show')

// Traiter l'inscription
router
  .post('/register', [RegistersController, 'store'])
  .as('register.store')

// Vérifier si l'adresse e-mail existe déjà
router
  .get('/auth/check-email', [RegistersController, 'checkEmail'])
  .as('auth.checkEmail')

// Afficher l'écran d'attente de vérification
router
  .get('/verify-email', [VerifyEmailController, 'show'])
  .as('verify-email.show')

// Renvoyer un nouveau lien de confirmation
router
  .post('/verify-email/resend', [VerifyEmailController, 'resend'])
  .as('verify-email.resend')


// Confirmer l'adresse e-mail à partir du token reçu
router
  .get('/verify-email/:token', [VerifyEmailController, 'confirm'])
  .as('verify-email.confirm')

// Afficher le formulaire de connexion
router
  .get('/login', [LoginsController, 'show'])
  .as('login.show')

// Traiter la connexion
router
  .post('/login', [LoginsController, 'store'])
  .as('login.store')

  // Afficher le formulaire "Mot de passe oublié"
router
  .get('/forgot-password', [ForgotPasswordsController, 'show'])
  .as('forgot-password.show')

// Envoyer le lien de réinitialisation par e-mail
router
  .post('/forgot-password', [ForgotPasswordsController, 'store'])
  .as('forgot-password.store')

// Afficher le formulaire de nouveau mot de passe
router
  .get('/reset-password/:token', [ResetPasswordsController, 'show'])
  .as('reset-password.show')

// Enregistrer le nouveau mot de passe
router
  .post('/reset-password/:token', [ResetPasswordsController, 'store'])
  .as('reset-password.store')

// Afficher l'interface de chat
router.get('/chat', async ({ view, session }) => {
  return view.render('pages/chat/index', {
    currentUserId: session.get('userId') ?? null,
  })
}).use(middleware.sessionAuth()).as('chat.index')


router.get('/settings', async ({ view }) => {
  return view.render('pages/chat/setting')
})

router
  .get('/users', [UsersController, 'index'])
  .as('users.index')


// Lister les conversations
router
  .get('/conversations', [ConversationsController, 'index'])
  .use(middleware.sessionAuth()).as('conversations.index')

// Afficher une conversation
router
  .get('/conversations/:id', [ConversationsController, 'show'])
  .use(middleware.sessionAuth()).as('conversations.show')

// Créer une conversation
router
  .post('/conversations', [ConversationsController, 'store'])
  .use(middleware.sessionAuth()).as('conversations.store')

router.patch('/conversations/:id/favorite', [ConversationsController, 'toggleFavorite'])

// Supprimer une conversation
router
  .delete('/conversations/:id', [ConversationsController, 'destroy'])
  .as('conversations.destroy')

router.post('/messages', [MessagesController, 'store']).use(middleware.sessionAuth())
.as('messages.store')
router.get('/conversations/:id/messages', [MessagesController, 'index']).use(middleware.sessionAuth())
router.post('/conversations/:id/messages', [MessagesController, 'store']).as('conversations.messages.store')
router.patch('/messages/:id', [MessagesController, 'update']).use(middleware.sessionAuth())
router.delete('/messages/:id', [MessagesController, 'destroy']).use(middleware.sessionAuth())

// Afficher le profil — accès réservé aux utilisateurs connectés
router
  .get('/profile', [ProfilesController, 'show'])
  .use(middleware.sessionAuth())

// Modifier les informations du profil
router
  .patch('/profile', [ProfilesController, 'update'])
  .use(middleware.sessionAuth())

// Modifier le mot de passe
router
  .patch('/profile/change-password', [
    ProfilesController,
    'changePassword',
  ])
  .use(middleware.sessionAuth())
  .as('profile.changePassword')