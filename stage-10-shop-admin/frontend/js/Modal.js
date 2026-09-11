export class Modal {
  constructor(root) {
    this.root = root;
    this.lastFocus = null;
    this.#bind();
  }

  get isOpen() {
    return this.root && this.root.classList.contains("modal_open");
  }

  open() {
    if (!this.root) return;
    this.lastFocus = document.activeElement;
    this.root.classList.add("modal_open");
    document.body.classList.add("modal-open");
    const focusable = this.root.querySelector("button, [href], input, select, textarea");
    if (focusable) focusable.focus();
  }

  close() {
    if (!this.root) return;
    this.root.classList.remove("modal_open");
    if (!document.querySelector(".modal_open")) {
      document.body.classList.remove("modal-open");
    }
    if (this.root.id && window.location.hash === "#" + this.root.id) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    if (this.lastFocus && typeof this.lastFocus.focus === "function") {
      this.lastFocus.focus();
    }
  }

  #bind() {
    if (!this.root) return;
    this.root.addEventListener("click", (event) => {
      if (event.target.closest(".modal__close, .modal__overlay")) {
        event.preventDefault();
        this.close();
      }
    });
  }
}
