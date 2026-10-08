import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('user_name', 'username')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.string('full_name', 100).notNullable().alter()
      table.string('username', 30).notNullable().alter()
      table.timestamp('updated_at', { useTz: true }).notNullable().alter()
      table.unique(['username'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['username'])
      table.string('username', 255).nullable().alter()
      table.string('full_name', 255).nullable().alter()
      table.timestamp('updated_at', { useTz: true }).nullable().alter()
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('username', 'user_name')
    })
  }
}