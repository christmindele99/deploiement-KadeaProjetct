import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import { MessageStatusSchema } from '#database/schema'
import Message from '#models/message'

export default class MessageStatus extends MessageStatusSchema {
  @hasMany(() => Message, {
    foreignKey: 'messageStatusId',
  })
  declare messages: HasMany<typeof Message>
}
