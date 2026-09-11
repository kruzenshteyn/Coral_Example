import { Modal } from "./Modal.js";
import { FormValidator } from "./FormValidator.js";

export class AuthModal extends Modal {
  constructor(root, session, onLogin) {
    super(root);
    this.session = session;
    this.onLogin = onLogin;
    this.signinForm = document.getElementById("form-signin");
    this.registerForm = document.getElementById("form-register");
    this.#bindTabs();
    this.#bindForms();
  }

  #bindTabs() {
    if (!this.root) return;
    this.root.addEventListener("click", (event) => {
      const tabBtn = event.target.closest("[data-tab]");
      if (!tabBtn) return;
      const tab = tabBtn.dataset.tab;
      this.root.querySelectorAll(".modal-tabs__btn").forEach((btn) => {
        btn.classList.toggle("modal-tabs__btn_active", btn === tabBtn);
      });
      this.signinForm.classList.toggle("form_hidden", tab !== "signin");
      this.registerForm.classList.toggle("form_hidden", tab !== "register");
    });
  }

  #bindForms() {
    if (this.signinForm) {
      this.signinForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = this.signinForm.querySelector("#auth-email");
        const password = this.signinForm.querySelector("#auth-password");
        const emailOk = FormValidator.setError(email, !FormValidator.isEmail(email.value));
        const passOk = FormValidator.setError(password, password.value.length < 6);
        if (!emailOk || !passOk) return;
        this.session
          .login(email.value, password.value)
          .then(() => this.#success(this.signinForm))
          .catch((error) => FormValidator.setError(password, true, error.message));
      });
    }

    if (this.registerForm) {
      this.registerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = this.registerForm.querySelector("#reg-name");
        const email = this.registerForm.querySelector("#reg-email");
        const password = this.registerForm.querySelector("#reg-password");
        const repeat = this.registerForm.querySelector("#reg-password-repeat");
        const nameOk = FormValidator.setError(name, name.value.trim().length < 2);
        const emailOk = FormValidator.setError(email, !FormValidator.isEmail(email.value));
        const passOk = FormValidator.setError(password, password.value.length < 6);
        const repeatOk = FormValidator.setError(repeat, password.value !== repeat.value);
        if (!nameOk || !emailOk || !passOk || !repeatOk) return;
        this.session
          .register(name.value.trim(), email.value, password.value)
          .then(() => this.#success(this.registerForm))
          .catch((error) => FormValidator.setError(email, true, error.message));
      });
    }
  }

  #success(form) {
    const status = form.querySelector(".form__status");
    if (status) status.classList.add("is-visible");
    if (this.onLogin) this.onLogin(this.session.current);
    setTimeout(() => this.close(), 600);
  }
}
