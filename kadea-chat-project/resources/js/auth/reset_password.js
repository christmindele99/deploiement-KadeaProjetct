const password = document.getElementById('password')
const passwordConfirmation = document.getElementById('passwordConfirmation')
const form = document.querySelector('form')

form.addEventListener('submit', function (event) {
    if (password.value !== passwordConfirmation.value) {
    event.preventDefault()

    passwordConfirmation.setCustomValidity(
        'Les deux mots de passe ne correspondent pas.'
    )

    passwordConfirmation.reportValidity()
    } else {
    passwordConfirmation.setCustomValidity('')
    }
})

passwordConfirmation.addEventListener('input', function () {
    passwordConfirmation.setCustomValidity('')
})