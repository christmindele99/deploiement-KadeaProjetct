import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  tableName = 'comments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.text('content').notNullable()

      table.integer('rating').notNullable()
      table.check('?? BETWEEN 1 AND 6', ['rating'])

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}