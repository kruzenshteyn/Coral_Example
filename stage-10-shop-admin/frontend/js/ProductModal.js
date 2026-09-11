import { Modal } from "./Modal.js";

export class ProductModal extends Modal {
  constructor(root, onSelect) {
    super(root);
    this.onSelect = onSelect;
    this.product = null;
    this.titleNode = document.getElementById("product-modal-title");
    this.categoryNode = document.getElementById("product-modal-category");
    this.priceNode = document.getElementById("product-modal-price");
    this.imageNode = document.getElementById("product-modal-image");
    this.textNode = this.root && this.root.querySelector(".modal__text");
    this.selectButton = this.root && this.root.querySelector("[data-select-product]");
    this.#bindSelect();
  }

  show(product) {
    this.product = product;
    if (this.titleNode) this.titleNode.textContent = product.title;
    if (this.categoryNode) this.categoryNode.textContent = product.category;
    if (this.imageNode) {
      this.imageNode.src = product.image;
      this.imageNode.alt = product.title;
    }
    if (this.priceNode) {
      const old = product.oldPrice
        ? "<s><data value=\"" + product.oldPrice + "\">" + product.oldPriceLabel + "</data></s> "
        : "";
      this.priceNode.innerHTML =
        old + "<data value=\"" + product.price + "\">" + product.priceLabel + "</data>";
    }
    if (this.textNode) this.textNode.textContent = product.description;
    this.open();
  }

  #bindSelect() {
    if (!this.selectButton) return;
    this.selectButton.addEventListener("click", () => {
      if (this.product && this.onSelect) this.onSelect(this.product);
    });
  }
}
