
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import { RoleSchema } from '#database/schema'
import Membership from '#models/membership'

export default class Role extends RoleSchema {
  @hasMany(() => Membership, {
    foreignKey: 'roleId',
  })
  declare memberships: HasMany<typeof Membership>
}
