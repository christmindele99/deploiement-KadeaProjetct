
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_reviews'

  async up() {
    await this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .unique()

      table.text('content').notNullable()

      table.integer('rating').notNullable()

      table.check(
        '"rating" BETWEEN 1 AND 6',
        [],
        'user_reviews_rating_check'
      )

      table.timestamp('created_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    await this.schema.dropTableIfExists(this.tableName)
  }
}
