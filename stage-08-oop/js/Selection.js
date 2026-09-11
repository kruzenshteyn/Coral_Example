import { StorageBox } from "./StorageBox.js";

export class Selection {
  constructor(key) {
    this.storage = new StorageBox(key, []);
  }

  ids() {
    const value = this.storage.read();
    return Array.isArray(value) ? value : [];
  }

  has(id) {
    return this.ids().includes(id);
  }

  add(id) {
    const ids = this.ids();
    if (!ids.includes(id)) {
      ids.push(id);
      this.storage.write(ids);
    }
    return ids;
  }

  paint(activeId, selectButton, cartCount) {
    const ids = this.ids();
    document.querySelectorAll(".product-card[data-product-id]").forEach((card) => {
      card.classList.toggle("product-card_selected", ids.includes(card.dataset.productId));
    });
    if (cartCount) {
      cartCount.textContent = String(ids.length);
      cartCount.hidden = ids.length === 0;
    }
    if (selectButton && activeId) {
      selectButton.textContent = ids.includes(activeId) ? "Selected" : "Select product";
    }
  }
}
