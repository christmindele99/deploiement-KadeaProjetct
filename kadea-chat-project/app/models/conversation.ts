import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import { ConversationSchema } from '#database/schema'
import Group from '#models/group'
import Message from '#models/message'
import Membership from '#models/membership'

export default class Conversation extends ConversationSchema {
  @belongsTo(() => Group, {
    foreignKey: 'groupId',
  })
  declare group: BelongsTo<typeof Group>

  @hasMany(() => Message, {
    foreignKey: 'conversationId',
  })
  declare messages: HasMany<typeof Message>

  @hasMany(() => Membership, {
    foreignKey: 'conversationId',
  })
  declare memberships: HasMany<typeof Membership>
}
