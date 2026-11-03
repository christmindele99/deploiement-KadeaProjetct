import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'message_statuses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('status', 20).notNullable().unique()
    })

    // Les 3 seules valeurs possibles
    this.schema.raw(
      `INSERT INTO ${this.tableName} (id, status) VALUES (1, 'Envoyé'), (2, 'Reçu'), (3, 'Lu')`
    )

    // Après des insertions manuelles, on recale le compteur d'identifiants
    this.schema.raw(`SELECT setval(pg_get_serial_sequence('${this.tableName}', 'id'), 3)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}