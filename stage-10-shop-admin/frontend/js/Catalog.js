import { api } from "./api.js";
import { Product } from "./Product.js";
import { ProductCard } from "./ProductCard.js";

export class Catalog {
  constructor(url, catalogRoot, bestsellersRoot) {
    this.url = url;
    this.catalogRoot = catalogRoot;
    this.bestsellersRoot = bestsellersRoot;
    this.items = [];
  }

  async load() {
    const rows = await api(this.url);
    this.items = rows.map((row) => new Product(row));
    return this.items;
  }

  findById(id) {
    return this.items.find((product) => product.id === id) || null;
  }

  bestsellers() {
    return this.items.filter((product) => product.bestseller);
  }

  render() {
    this.#fill(this.catalogRoot, this.items);
    this.#fill(this.bestsellersRoot, this.bestsellers());
  }

  showError(error) {
    const message =
      "Could not load /api/products. Start a backend from stage-10-shop-admin.";
    [this.catalogRoot, this.bestsellersRoot].forEach((list) => {
      if (!list) return;
      const item = document.createElement("li");
      item.className = "products__status products__status_error";
      item.textContent = message;
      list.replaceChildren(item);
    });
    console.error(error);
  }

  #fill(list, products) {
    if (!list) return;
    list.replaceChildren(...products.map((product) => new ProductCard(product).render()));
  }
}
