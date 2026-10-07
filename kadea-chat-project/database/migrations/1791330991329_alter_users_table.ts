import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable('users', (table) => {
      table.string('user_name').nullable()
      table.string('avatar').nullable()
      table.text('bio').nullable()
      table.timestamp('email_verified_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('user_name')
      table.dropColumn('avatar')
      table.dropColumn('bio')
      table.dropColumn('email_verified_at')
    })
  }
}