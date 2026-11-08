import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
import { middleware } from '#start/kernel'

transmit.registerRoutes()

router
  .get('/', async ({ view }) => {
    return view.render('pages/home')
  })
  .as('home')

const ConversationsController = () => import('#controllers/conversations_controller')
const RegistersController = () => import('#controllers/registers_controller')
const VerifyEmailController = () => import('#controllers/verify_emails_controller')
const LoginsController = () => import('#controllers/logins_controller')
const ForgotPasswordsController = () => import('#controllers/forgot_passwords_controller')
const ResetPasswordsController = () => import('#controllers/reset_passwords_controller')
const UsersController = () => import('#controllers/users_controller')
const MessagesController = () => import('#controllers/messages_controller')
const ProfilesController = () => import('#controllers/profiles_controller')
const LogoutsController = () => import('#controllers/logouts_controller')
const GroupsController = () => import('#controllers/groups_controller')
const CommentsController = () => import('#controllers/comments_controller')
const PresenceController = () => import('#controllers/presence_controller')

router.get('/register', [RegistersController, 'show']).as('register.show')

router.post('/register', [RegistersController, 'store']).as('register.store')

router.get('/auth/check-email', [RegistersController, 'checkEmail']).as('auth.checkEmail')

router.get('/verify-email', [VerifyEmailController, 'show']).as('verify-email.show')

router.post('/verify-email/resend', [VerifyEmailController, 'resend']).as('verify-email.resend')

router.get('/verify-email/:token', [VerifyEmailController, 'confirm']).as('verify-email.confirm')

router.get('/login', [LoginsController, 'show']).as('login.show')

router.post('/login', [LoginsController, 'store']).as('login.store')

router.get('/forgot-password', [ForgotPasswordsController, 'show']).as('forgot-password.show')

router.post('/forgot-password', [ForgotPasswordsController, 'store']).as('forgot-password.store')

router.get('/reset-password/:token', [ResetPasswordsController, 'show']).as('reset-password.show')

router
  .post('/reset-password/:token', [ResetPasswordsController, 'store'])
  .as('reset-password.store')

router
  .get('/chat', async ({ view, session }) => {
    return view.render('pages/chat/index', {
      currentUserId: session.get('userId') ?? null,
    })
  })
  .use(middleware.sessionAuth())
  .as('chat.index')

router
  .get('/settings', async ({ view }) => {
    return view.render('pages/chat/setting')
  })
  .use(middleware.sessionAuth())

router
  .get('/politique-confidentialite', async ({ view }) => {
    return view.render('pages/chat/politiqueConficdentialite')
  })
  .use(middleware.sessionAuth())
  .as('politique-confidentialite.show')

router
  .get('/commentaire', async ({ view, session, response }) => {
    const userId = session.get('userId')

    if (!userId) {
      return response.unauthorized({
        message: 'Vous devez être connecté pour accéder à cette page.',
      })
    }

    const User = (await import('#models/user')).default
    const user = await User.find(userId)

    if (!user) {
      session.forget('userId')

      return response.unauthorized({
        message: 'Utilisateur introuvable. Veuillez vous reconnecter.',
      })
    }

    return view.render('pages/chat/commentaire', {
      user,
    })
  })
  .use(middleware.sessionAuth())
  .as('commentaire.show')

// Enregistrer le commentaire d'un utilisateur
router
  .post('/comments', [CommentsController, 'store'])
  .use(middleware.sessionAuth())
  .as('comments.store')

router.get('/users', [UsersController, 'index']).as('users.index')

router
  .get('/conversations', [ConversationsController, 'index'])
  .use(middleware.sessionAuth())
  .as('conversations.index')

router
  .get('/conversations/:id', [ConversationsController, 'show'])
  .use(middleware.sessionAuth())
  .as('conversations.show')

router
  .post('/conversations', [ConversationsController, 'store'])
  .use(middleware.sessionAuth())
  .as('conversations.store')

router.patch('/conversations/:id/favorite', [ConversationsController, 'toggleFavorite'])

router
  .delete('/conversations/:id', [ConversationsController, 'destroy'])
  .as('conversations.destroy')

router
  .post('/messages', [MessagesController, 'store'])
  .use(middleware.sessionAuth())
  .as('messages.store')
router
  .get('/conversations/:id/messages', [MessagesController, 'index'])
  .use(middleware.sessionAuth())
router
  .post('/conversations/:id/messages', [MessagesController, 'store'])
  .as('conversations.messages.store')
router.patch('/messages/:id', [MessagesController, 'update']).use(middleware.sessionAuth())
router.delete('/messages/:id', [MessagesController, 'destroy']).use(middleware.sessionAuth())

router.get('/profile', [ProfilesController, 'show']).use(middleware.sessionAuth())

router
  .get('/confidentialite', async ({ view }) => {
    return view.render('pages/chat/confidentialite')
  })
  .use(middleware.sessionAuth())
  .as('confidentialite.show')

router.patch('/profile', [ProfilesController, 'update']).use(middleware.sessionAuth())

// Modifier le mot de passe
router
  .patch('/profile/change-password', [ProfilesController, 'changePassword'])
  .use(middleware.sessionAuth())
  .as('profile.changePassword')

router.patch('/profile/avatar', [ProfilesController, 'updateAvatar'])

router.post('/groups', [GroupsController, 'store'])
router.get('/conversations/:id/group', [GroupsController, 'show'])
router.patch('/conversations/:id/group', [GroupsController, 'update'])
router.post('/conversations/:id/group/members', [GroupsController, 'addMembers'])
router
  .delete('/conversations/:id/group/members', [GroupsController, 'removeMembers'])
  .use(middleware.sessionAuth())

router.delete('/conversations/:id/group', [GroupsController, 'destroy']).as('groups.destroy')

router
  .patch('/conversations/:id/group/avatar', [GroupsController, 'updateAvatar'])
  .use(middleware.sessionAuth())

router.post('/presence/ping', [PresenceController, 'ping']).use(middleware.sessionAuth())
router.get('/presence/:id', [PresenceController, 'show']).use(middleware.sessionAuth())
router
  .post('/conversations/:id/typing', [PresenceController, 'typing'])
  .use(middleware.sessionAuth())

router
  .post('/logout', [LogoutsController, 'destroy'])
  .use(middleware.sessionAuth())
  .as('logout.destroy')
