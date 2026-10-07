import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conversations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('group_id')
        .unsigned()
        .nullable()
        .unique()
        .references('id')
        .inTable('groups')
        .onDelete('CASCADE')

      table.string('pair_key').nullable().unique()

      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}