export class ProductCard {
  constructor(product) {
    this.product = product;
  }

  render() {
    const item = document.createElement("li");
    const article = document.createElement("article");
    article.className = "product-card";
    article.dataset.productId = this.product.id;

    if (this.product.badge) {
      const badge = document.createElement("p");
      badge.className = "product-card__badge product-card__badge_type_" + this.product.badge;
      badge.textContent = this.product.badgeLabel;
      article.append(badge);
    }

    const link = document.createElement("a");
    link.className = "product-card__media";
    link.href = "#modal-product";

    const image = document.createElement("img");
    image.src = this.product.image;
    image.width = 400;
    image.height = 500;
    image.alt = this.product.title;

    const hover = document.createElement("span");
    hover.className = "product-card__hover";
    hover.textContent = "View product";
    link.append(image, hover);

    const title = document.createElement("h3");
    title.textContent = this.product.title;

    const category = document.createElement("p");
    category.className = "product-card__category";
    category.textContent = this.product.category;

    article.append(link, title, category, this.#priceNode());
    item.append(article);
    return item;
  }

  #priceNode() {
    const price = document.createElement("p");
    price.className = "product-card__price";

    if (this.product.oldPrice != null) {
      const old = document.createElement("s");
      const oldData = document.createElement("data");
      oldData.value = this.product.oldPrice;
      oldData.textContent = this.product.oldPriceLabel;
      old.append(oldData);
      price.append(old, " ");
    }

    const current = document.createElement("data");
    current.value = this.product.price;
    current.textContent = this.product.priceLabel;
    price.append(current);
    return price;
  }
}
