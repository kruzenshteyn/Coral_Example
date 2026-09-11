export class CategoryTabs {
  constructor(root) {
    this.root = root;
    if (!this.root) return;
    this.root.querySelectorAll(".tabs a").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        this.filter(link);
      });
    });
  }

  filter(activeLink) {
    const value = activeLink.textContent.trim().toLowerCase();
    this.root.querySelectorAll(".tabs a").forEach((item) => {
      item.classList.toggle("tabs__link_active", item === activeLink);
    });
    this.root.querySelectorAll(".product-card").forEach((card) => {
      const category = (card.querySelector(".product-card__category") || {}).textContent || "";
      const show = value === "all products" || category.toLowerCase() === value;
      card.closest("li").hidden = !show;
    });
  }
}
