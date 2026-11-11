
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import { GroupSchema } from '#database/schema'
import Conversation from '#models/conversation'

export default class Group extends GroupSchema {
  @hasMany(() => Conversation, {
    foreignKey: 'groupId',
  })
  declare conversations: HasMany<typeof Conversation>
}
