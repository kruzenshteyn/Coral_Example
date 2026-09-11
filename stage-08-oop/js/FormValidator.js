export class FormValidator {
  static isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  static setError(input, invalid) {
    input.classList.toggle("is-invalid", invalid);
    const error = input.parentElement.querySelector(".form__error");
    if (error) error.classList.toggle("is-visible", invalid);
    return !invalid;
  }
}
