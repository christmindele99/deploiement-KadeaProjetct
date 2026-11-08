import { initializeValidations } from './features/validations.js'
import { initializeEmailAvailability } from './features/email-availability.js'

function initializeRegister() {
  const registerForm = document.querySelector('form')

  const fullName = document.getElementById('fullName')
  const email = document.getElementById('email')
  const password = document.getElementById('password')
  const passwordConfirmation = document.getElementById('passwordConfirmation')

  if (!registerForm || !fullName || !email || !password || !passwordConfirmation) {
    return
  }

  const validators = initializeValidations({
    fullName,
    email,
    password,
    passwordConfirmation,
  })

  const checkEmailAvailability = initializeEmailAvailability({
    email,
    validateEmail: validators.validateEmail,
  })

  function initializeFormSubmission() {
    registerForm.addEventListener('submit', async function (event) {
      event.preventDefault()

      const isFullNameValid = validators.validateFullName()

      const isEmailValid = validators.validateEmail()

      const isPasswordValid = validators.validatePassword()

      const isConfirmationValid = validators.validatePasswordConfirmation()

      if (!isFullNameValid || !isEmailValid || !isPasswordValid || !isConfirmationValid) {
        return
      }

      const isEmailAvailable = await checkEmailAvailability()
      if (!isEmailAvailable) {
        return
      }
      registerForm.submit()
    })
  }
  initializeFormSubmission()
}

document.addEventListener('DOMContentLoaded', initializeRegister)
