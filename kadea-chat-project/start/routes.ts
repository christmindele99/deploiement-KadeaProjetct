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
  .get('/chat', async ({ view, auth }) => {
    return view.render('pages/chat/index', {
      currentUserId: auth.user!.id,
    })
  })
  .use(middleware.auth({ guards: ['web'] }))
  .as('chat.index')

router
  .get('/settings', async ({ view }) => {
    return view.render('pages/chat/setting')
  })
  .use(middleware.auth({ guards: ['web'] }))

router
  .get('/politique-confidentialite', async ({ view }) => {
    return view.render('pages/chat/politiqueConficdentialite')
  })
  .use(middleware.auth({ guards: ['web'] }))
  .as('politique-confidentialite.show')

router
  .get('/commentaire', async ({ view, auth }) => {
    const user = auth.user!

    return view.render('pages/chat/commentaire', {
      user,
    })
  })
  .use(middleware.auth({ guards: ['web'] }))
  .as('commentaire.show')

router
  .post('/comments', [CommentsController, 'store'])
  .use(middleware.auth({ guards: ['web'] }))
  .as('comments.store')

router
  .get('/users', [UsersController, 'index'])
  .use(middleware.auth({ guards: ['web'] }))
  .as('users.index')

router
  .get('/conversations', [ConversationsController, 'index'])
  .use(middleware.auth({ guards: ['web'] }))
  .as('conversations.index')

router
  .get('/conversations/:id', [ConversationsController, 'show'])
  .use(middleware.auth({ guards: ['web'] }))
  .as('conversations.show')

router
  .post('/conversations', [ConversationsController, 'store'])
  .use(middleware.auth({ guards: ['web'] }))
  .as('conversations.store')

router
  .patch('/conversations/:id/favorite', [ConversationsController, 'toggleFavorite'])
  .use(middleware.auth({ guards: ['web'] }))

router
  .delete('/conversations/:id', [ConversationsController, 'destroy'])
  .use(middleware.auth({ guards: ['web'] }))
  .as('conversations.destroy')

router
  .post('/messages', [MessagesController, 'store'])
  .use(middleware.auth({ guards: ['web'] }))
  .as('messages.store')

router
  .get('/conversations/:id/messages', [MessagesController, 'index'])
  .use(middleware.auth({ guards: ['web'] }))

router
  .post('/conversations/:id/messages', [MessagesController, 'store'])
  .use(middleware.auth({ guards: ['web'] }))
  .as('conversations.messages.store')

router
  .patch('/messages/:id', [MessagesController, 'update'])
  .use(middleware.auth({ guards: ['web'] }))

router
  .delete('/messages/:id', [MessagesController, 'destroy'])
  .use(middleware.auth({ guards: ['web'] }))

router.get('/profile', [ProfilesController, 'show']).use(middleware.auth({ guards: ['web'] }))

router
  .get('/confidentialite', async ({ view }) => {
    return view.render('pages/chat/confidentialite')
  })
  .use(middleware.auth({ guards: ['web'] }))
  .as('confidentialite.show')

router.patch('/profile', [ProfilesController, 'update']).use(middleware.auth({ guards: ['web'] }))

router
  .patch('/profile/change-password', [ProfilesController, 'changePassword'])
  .use(middleware.auth({ guards: ['web'] }))
  .as('profile.changePassword')

router
  .patch('/profile/avatar', [ProfilesController, 'updateAvatar'])
  .use(middleware.auth({ guards: ['web'] }))

router.post('/groups', [GroupsController, 'store']).use(middleware.auth({ guards: ['web'] }))

router
  .get('/conversations/:id/group', [GroupsController, 'show'])
  .use(middleware.auth({ guards: ['web'] }))

router
  .patch('/conversations/:id/group', [GroupsController, 'update'])
  .use(middleware.auth({ guards: ['web'] }))

router
  .post('/conversations/:id/group/members', [GroupsController, 'addMembers'])
  .use(middleware.auth({ guards: ['web'] }))

router
  .delete('/conversations/:id/group/members', [GroupsController, 'removeMembers'])
  .use(middleware.auth({ guards: ['web'] }))

router
  .delete('/conversations/:id/group', [GroupsController, 'destroy'])
  .use(middleware.auth({ guards: ['web'] }))
  .as('groups.destroy')

router
  .patch('/conversations/:id/group/avatar', [GroupsController, 'updateAvatar'])
  .use(middleware.auth({ guards: ['web'] }))

router
  .post('/presence/ping', [PresenceController, 'ping'])
  .use(middleware.auth({ guards: ['web'] }))

router.get('/presence/:id', [PresenceController, 'show']).use(middleware.auth({ guards: ['web'] }))

router
  .post('/conversations/:id/typing', [PresenceController, 'typing'])
  .use(middleware.auth({ guards: ['web'] }))

router
  .post('/logout', [LogoutsController, 'destroy'])
  .use(middleware.auth({ guards: ['web'] }))
  .as('logout.destroy')
