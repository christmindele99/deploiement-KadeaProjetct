import { showError, removeError } from './form-errors.js';

export function initializeValidations({
        fullName,
        email,
        password,
        passwordConfirmation,
    }) {
  function validateFullName() {
    const value = fullName.value.trim();
    if (value === '') {
      showError(
        fullName,
        'Le nom complet est obligatoire.'
      );
      return false;
    }

    const nameRegex =
      /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
    if (!nameRegex.test(value)) {
      showError(
        fullName,
        'Le nom doit contenir uniquement des lettres et des espaces.'
      );

      return false;
    }
    removeError(fullName);
    return true;
  }

 
  function validateEmail() {
    const value = email.value.trim();
    if (value === '') {
      showError(
        email,
        'L’adresse email est obligatoire.'
      );
      return false;
    }
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(value)) {
      showError(
        email,
        'Veuillez entrer une adresse Gmail valide.'
      );
      return false;
    }
    removeError(email);
    return true;
  }


  function validatePassword() {
    const value = password.value;
    if (value === '') {
      showError(
        password,
        'Le mot de passe est obligatoire.'
      );
      return false;
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(value)) {
      showError(
        password,
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
      );
      return false;
    }
    removeError(password);
    return true;
  }

  
  function validatePasswordConfirmation() {
    const value = passwordConfirmation.value;
    if (value === '') {
      showError(
        passwordConfirmation,
        'La confirmation du mot de passe est obligatoire.'
      );
      return false;
    }

    if (value !== password.value) {
      showError(
        passwordConfirmation,
        'Les mots de passe ne correspondent pas.'
      );
      return false;
    }
    removeError(passwordConfirmation);
    return true;
  }

  
  function initializeValidationEvents() {
    fullName.addEventListener(
      'input',
      validateFullName
    );
    email.addEventListener(
      'input',
      validateEmail
    );
    password.addEventListener(
      'input',
      () => {
        validatePassword();

        if (passwordConfirmation.value !== '') {
          validatePasswordConfirmation();
        }
      }
    );
    passwordConfirmation.addEventListener(
      'input',
      validatePasswordConfirmation
    );
  }

  initializeValidationEvents();
  return {
    validateFullName,
    validateEmail,
    validatePassword,
    validatePasswordConfirmation,
  };
}
