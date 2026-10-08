import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'groups'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('name', 100).notNullable().alter()
      table.string('description', 300).nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('name', 255).notNullable().alter()
      table.string('description', 255).notNullable().alter()
    })
  }
}