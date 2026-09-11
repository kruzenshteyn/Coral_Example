import { Catalog } from "./Catalog.js";
import { UserSession } from "./UserSession.js";
import { Selection } from "./Selection.js";
import { AuthModal } from "./AuthModal.js";
import { ProductModal } from "./ProductModal.js";
import { BurgerMenu } from "./BurgerMenu.js";
import { CategoryTabs } from "./CategoryTabs.js";

export class App {
  constructor() {
    this.catalog = new Catalog(
      "data/products.json",
      document.querySelector("[data-catalog]"),
      document.querySelector("[data-bestsellers]")
    );
    this.session = new UserSession("coral-user");
    this.selection = new Selection("coral-selected");
    this.accountLabel = document.querySelector("[data-account-label]");
    this.cartCount = document.querySelector("[data-cart-count]");
    this.selectButton = document.querySelector("[data-select-product]");

    this.authModal = new AuthModal(
      document.getElementById("modal-auth"),
      this.session,
      () => this.#paintUser()
    );
    this.productModal = new ProductModal(
      document.getElementById("modal-product"),
      (product) => this.#selectProduct(product)
    );

    new BurgerMenu(document.querySelector(".burger"), document.querySelector(".menu"));
    new CategoryTabs(document.querySelector(".bestsellers"));

    this.#bindGlobal();
    this.#paintUser();
  }

  async start() {
    try {
      await this.catalog.load();
      this.catalog.render();
      this.#paintSelection();
    } catch (error) {
      this.catalog.showError(error);
    }
  }

  #bindGlobal() {
    document.addEventListener("click", (event) => {
      if (event.target.closest('a[href="#modal-auth"]')) {
        event.preventDefault();
        this.authModal.open();
        return;
      }

      const media = event.target.closest(".product-card__media");
      if (media) {
        const card = media.closest("[data-product-id]");
        const product = card && this.catalog.findById(card.dataset.productId);
        if (product) {
          event.preventDefault();
          this.productModal.show(product);
          this.#paintSelection();
        }
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      this.authModal.close();
      this.productModal.close();
    });
  }

  #paintUser() {
    if (this.accountLabel) {
      this.accountLabel.textContent = this.session.displayName();
    }
  }

  #paintSelection() {
    const activeId = this.productModal.product ? this.productModal.product.id : null;
    this.selection.paint(activeId, this.selectButton, this.cartCount);
  }

  #selectProduct(product) {
    if (!this.session.isLoggedIn) {
      this.productModal.close();
      this.authModal.open();
      return;
    }
    this.selection.add(product.id);
    this.#paintSelection();
  }
}

const app = new App();
app.start();
