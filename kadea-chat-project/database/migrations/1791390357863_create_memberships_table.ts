import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'memberships'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('user_conversation', 'conversation_id')
    })

    this.schema.raw(
      `ALTER TABLE ${this.tableName}
       RENAME CONSTRAINT memberships_user_conversation_foreign
       TO memberships_conversation_id_foreign`
    )

    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('joined_at', { useTz: true }).notNullable().defaultTo(this.now()).alter()
      table.index(['conversation_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['conversation_id'])
      table.timestamp('joined_at', { useTz: true }).notNullable().alter()
    })

    this.schema.raw(
      `ALTER TABLE ${this.tableName}
       RENAME CONSTRAINT memberships_conversation_id_foreign
       TO memberships_user_conversation_foreign`
    )

    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('conversation_id', 'user_conversation')
    })
  }
}