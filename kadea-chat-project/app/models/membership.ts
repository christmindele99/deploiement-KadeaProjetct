import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import { MembershipSchema } from '#database/schema'
import User from '#models/user'
import Conversation from '#models/conversation'
import Role from '#models/role'

export default class Membership extends MembershipSchema {
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Conversation, {
    foreignKey: 'conversationId',
  })
  declare conversation: BelongsTo<typeof Conversation>

  @belongsTo(() => Role, {
    foreignKey: 'roleId',
  })
  declare role: BelongsTo<typeof Role>
}
