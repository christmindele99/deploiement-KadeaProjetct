import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { UserSchema } from '#database/schema'
import Comment from '#models/comment'
import Membership from '#models/membership'
import Message from '#models/message'
import UserToken from '#models/user_token'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  @hasMany(() => Comment, {
    foreignKey: 'userId',
  })
  declare comments: HasMany<typeof Comment>

  @hasMany(() => Membership, {
    foreignKey: 'userId',
  })
  declare memberships: HasMany<typeof Membership>

  @hasMany(() => Message, {
    foreignKey: 'authorId',
  })
  declare messages: HasMany<typeof Message>

  @hasMany(() => UserToken, {
    foreignKey: 'userId',
  })
  declare userTokens: HasMany<typeof UserToken>

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')

    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
