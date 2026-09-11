import { api } from "./api.js";
import { Catalog } from "./Catalog.js";
import { UserSession } from "./UserSession.js";
import { AuthModal } from "./AuthModal.js";
import { ProductModal } from "./ProductModal.js";
import { BurgerMenu } from "./BurgerMenu.js";
import { CategoryTabs } from "./CategoryTabs.js";

export class App {
  constructor() {
    this.catalog = new Catalog(
      "/api/products",
      document.querySelector("[data-catalog]"),
      document.querySelector("[data-bestsellers]")
    );
    this.session = new UserSession();
    this.accountLabel = document.querySelector("[data-account-label]");
    this.cartCount = document.querySelector("[data-cart-count]");
    this.logoutButton = document.querySelector("[data-logout]");
    this.adminLink = document.querySelector("[data-admin-link]");
    this.selectButton = document.querySelector("[data-select-product]");

    this.authModal = new AuthModal(document.getElementById("modal-auth"), this.session, () =>
      this.#afterAuth()
    );
    this.productModal = new ProductModal(document.getElementById("modal-product"), (product) =>
      this.#addToCart(product)
    );

    new BurgerMenu(document.querySelector(".burger"), document.querySelector(".menu"));
    new CategoryTabs(document.querySelector(".bestsellers"));

    this.#bindGlobal();
  }

  async start() {
    await this.session.refresh();
    this.#paintUser();
    try {
      await this.catalog.load();
      this.catalog.render();
    } catch (error) {
      this.catalog.showError(error);
    }
    await this.#paintCart();
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
          if (this.selectButton) this.selectButton.textContent = "Add to cart";
        }
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      this.authModal.close();
      this.productModal.close();
    });

    if (this.logoutButton) {
      this.logoutButton.addEventListener("click", async () => {
        await this.session.logout();
        this.#paintUser();
        await this.#paintCart();
      });
    }
  }

  async #afterAuth() {
    this.#paintUser();
    await this.#paintCart();
  }

  #paintUser() {
    if (this.accountLabel) this.accountLabel.textContent = this.session.displayName();
    if (this.logoutButton) this.logoutButton.hidden = !this.session.isLoggedIn;
    if (this.adminLink) this.adminLink.hidden = !this.session.isAdmin;
  }

  async #paintCart() {
    if (!this.cartCount) return;
    if (!this.session.isLoggedIn) {
      this.cartCount.hidden = true;
      return;
    }
    try {
      const items = await api("/api/cart");
      const count = items.reduce((sum, item) => sum + item.quantity, 0);
      this.cartCount.textContent = String(count);
      this.cartCount.hidden = count === 0;
    } catch (error) {
      this.cartCount.hidden = true;
    }
  }

  async #addToCart(product) {
    if (!this.session.isLoggedIn) {
      this.productModal.close();
      this.authModal.open();
      return;
    }
    await api("/api/cart", { method: "POST", body: { productId: product.id, quantity: 1 } });
    if (this.selectButton) this.selectButton.textContent = "Added";
    await this.#paintCart();
  }
}

const app = new App();
app.start();
