export class Product {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.category = data.category;
    this.price = Number(data.price);
    this.oldPrice = data.oldPrice != null ? Number(data.oldPrice) : null;
    this.image = data.image;
    this.badge = data.badge || null;
    this.bestseller = Boolean(data.bestseller);
    this.description = data.description || "";
  }

  formatPrice(value) {
    return "$" + Number(value).toFixed(2);
  }

  get priceLabel() {
    return this.formatPrice(this.price);
  }

  get oldPriceLabel() {
    return this.oldPrice == null ? "" : this.formatPrice(this.oldPrice);
  }

  get badgeLabel() {
    if (this.badge === "sale") return "Sale";
    if (this.badge === "hot") return "Hot";
    return "";
  }
}
