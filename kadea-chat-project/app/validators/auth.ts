import vine from '@vinejs/vine'

export const registerValidator = vine.create(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100),
    email: vine
      .string()
      .trim()
      .toLowerCase()
      .email()
      .maxLength(254)
      .unique({ table: 'users', column: 'email' }),
    password: vine.string().minLength(8).maxLength(64),
    passwordConfirmation: vine.string().sameAs('password'),
  })
)


export const loginValidator = vine.create({
  emailOrUsername: vine.string().trim().minLength(1).maxLength(254),
  password: vine.string().minLength(1),
})
