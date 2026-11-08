import { setupChangePassword } from './features/confidentialite-change-password.js'
import { setupResetPassword } from './features/confidentialite-reset-password.js'

document.addEventListener('DOMContentLoaded', () => {
  setupChangePassword() 
  setupResetPassword() 
})
