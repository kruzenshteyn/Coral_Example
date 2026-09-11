export class BurgerMenu {
  constructor(button, menu) {
    this.button = button;
    this.menu = menu;
    if (this.button && this.menu) {
      this.button.addEventListener("click", () => this.toggle());
    }
  }

  toggle() {
    const open = this.menu.classList.toggle("is-open");
    this.button.setAttribute("aria-expanded", String(open));
  }
}
