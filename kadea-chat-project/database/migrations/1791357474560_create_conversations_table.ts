import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conversations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('pair_key', 32).nullable().alter()
    })

    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT conversations_group_or_pair_check
       CHECK ((group_id IS NULL) <> (pair_key IS NULL))`
    )
  }

  async down() {
    this.schema.raw(
      `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS conversations_group_or_pair_check`
    )

    this.schema.alterTable(this.tableName, (table) => {
      table.string('pair_key', 255).nullable().alter()
    })
  }
}