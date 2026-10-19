import { showError, removeError } from './form-errors.js';

export function initializeEmailAvailability({
  email,
  validateEmail,
}) {
  async function checkEmailAvailability() {
    const value = email.value.trim();
    if (!validateEmail()) {
      return false;
    }

    try {
      const response = await fetch(
        `/auth/check-email?email=${encodeURIComponent(value)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error(
          'Erreur lors de la vérification de l\'email.'
        );
      }
      const data = await response.json();
      // L'adresse est déjà utilisée.
      if (data.exists) {
        showError(
          email,
          'Cette adresse email est déjà utilisée.'
        );
        return false;
      }
      removeError(email);
      return true;
    } catch (error) {
      showError(
        email,
        'Impossible de vérifier cette adresse email. Veuillez réessayer.'
      );
      return false;
    }
  }
  return checkEmailAvailability;
}
