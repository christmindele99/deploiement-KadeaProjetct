import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_token'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('fk', 'user_id')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.integer('user_id').unsigned().notNullable().alter()
      table.string('type', 30).notNullable().alter()
      table.string('token_hash', 64).notNullable().alter()
      table.timestamp('expires_at', { useTz: true }).notNullable().alter()
      table.unique(['token_hash'])
      table.index(['user_id'])
    })

    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT user_tokens_type_check
       CHECK (type IN ('email_verification', 'password_reset'))`
    )
  }

  async down() {
    this.schema.raw(
      `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS user_tokens_type_check`
    )

    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['token_hash'])
      table.dropIndex(['user_id'])
      table.integer('user_id').unsigned().nullable().alter()
      table.string('type', 255).nullable().alter()
      table.string('token_hash', 255).nullable().alter()
      table.timestamp('expires_at', { useTz: true }).nullable().alter()
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('user_id', 'fk')
    })
  }
}