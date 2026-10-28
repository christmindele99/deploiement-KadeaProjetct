import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  tableName = 'comments'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['user_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['user_id'])
    })
  }
}