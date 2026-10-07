import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'memberships'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('user_id').unsigned().notNullable()
      table.integer('user_conversation').unsigned().notNullable()
      table.integer('role_id').unsigned().notNullable()
      table.timestamp('joined_at').notNullable()

      table.primary(['user_id', 'user_conversation'])

      table
        .foreign('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .foreign('user_conversation')
        .references('id')
        .inTable('conversations')
        .onDelete('CASCADE')

      table
        .foreign('role_id')
        .references('id')
        .inTable('roles')
        .onDelete('RESTRICT')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}