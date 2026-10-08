import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('content').nullable().alter()
      table.index(['conversation_id', 'created_at'])
    })

    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT messages_content_deleted_check
       CHECK ((content IS NULL) = (deleted_at IS NOT NULL))`
    )
  }

  async down() {
    this.schema.raw(
      `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS messages_content_deleted_check`
    )

    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['conversation_id', 'created_at'])
      table.string('content', 255).notNullable().alter()
    })
  }
}