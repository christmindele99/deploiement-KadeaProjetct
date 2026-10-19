export function showError(input, message) {
  // Supprime l'ancienne erreur
  removeError(input);

  // Ajoute une bordure rouge
  input.classList.remove('border-white');
  input.classList.add('border-red-400');
  const error = document.createElement('p');
  error.className =
    'js-error mt-1 text-xs text-red-300 font-medium flex items-center gap-1';
  const icon = document.createElement('span');
  icon.textContent = '⚠️';
  const text = document.createTextNode(` ${message}`);
  error.append(icon, text);
  input.parentElement.appendChild(error);
}

export function removeError(input) {
  const oldError =
    input.parentElement.querySelector('.js-error');
  if (oldError) {
    oldError.remove();
  }
  input.classList.remove('border-red-400');
  input.classList.add('border-white');
}
