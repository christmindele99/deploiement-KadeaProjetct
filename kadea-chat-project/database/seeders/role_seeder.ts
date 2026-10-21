import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/role'

export default class extends BaseSeeder {
  async run() {
    await Role.updateOrCreateMany('id', [
      { id: 1, name: 'admin' },
      { id: 2, name: 'member' },
    ])
  }
}