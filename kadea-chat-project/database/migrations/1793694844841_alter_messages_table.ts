import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('message_status_id')
        .unsigned()
        .notNullable()
        .defaultTo(1)
        .references('id')
        .inTable('message_statuses')
        .onDelete('RESTRICT')
    })

    // Les anciens messages sont considérés comme déjà lus
    this.schema.raw('UPDATE messages SET message_status_id = 3')
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['message_status_id'])
      table.dropColumn('message_status_id')
    })
  }
}