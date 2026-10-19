import { UserTokenSchema } from '#database/schema'

export default class UserToken extends UserTokenSchema {
  static table = 'user_token'
}
