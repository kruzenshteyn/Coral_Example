export class FormValidator {
  static isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  static setError(input, invalid, message) {
    input.classList.toggle("is-invalid", invalid);
    const error = input.parentElement.querySelector(".form__error");
    if (error) {
      if (message) error.textContent = message;
      error.classList.toggle("is-visible", invalid);
    }
    return !invalid;
  }
}
