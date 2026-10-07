import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable('users', (table) => {
      table.unique(['user_name'])
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropUnique(['user_name'])
    })
  }
}