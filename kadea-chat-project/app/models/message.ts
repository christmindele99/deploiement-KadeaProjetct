import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import { MessageSchema } from '#database/schema'
import User from '#models/user'
import Conversation from '#models/conversation'
import MessageStatus from '#models/message_status'

export default class Message extends MessageSchema {
  @belongsTo(() => User, {
    foreignKey: 'authorId',
  })
  declare author: BelongsTo<typeof User>

  @belongsTo(() => Conversation, {
    foreignKey: 'conversationId',
  })
  declare conversation: BelongsTo<typeof Conversation>

  @belongsTo(() => MessageStatus, {
    foreignKey: 'messageStatusId',
  })
  declare messageStatus: BelongsTo<typeof MessageStatus>
}
