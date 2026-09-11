let PRODUCTS = [];

function money(value) {
  return "$" + Number(value).toFixed(2);
}

function setListStatus(list, message, isError) {
  if (!list) return;
  const item = document.createElement("li");
  item.className = "products__status" + (isError ? " products__status_error" : "");
  item.textContent = message;
  list.replaceChildren(item);
}

function renderPrice(product) {
  const price = document.createElement("p");
  price.className = "product-card__price";

  if (product.oldPrice) {
    const old = document.createElement("s");
    const oldData = document.createElement("data");
    oldData.value = product.oldPrice;
    oldData.textContent = money(product.oldPrice);
    old.append(oldData);
    price.append(old);
    price.append(" ");
  }

  const current = document.createElement("data");
  current.value = product.price;
  current.textContent = money(product.price);
  price.append(current);
  return price;
}

function renderCard(product) {
  const item = document.createElement("li");
  const article = document.createElement("article");
  article.className = "product-card";
  article.dataset.productId = product.id;

  if (product.badge) {
    const badge = document.createElement("p");
    badge.className = "product-card__badge product-card__badge_type_" + product.badge;
    badge.textContent = product.badge === "sale" ? "Sale" : "Hot";
    article.append(badge);
  }

  const link = document.createElement("a");
  link.className = "product-card__media";
  link.href = "#modal-product";

  const image = document.createElement("img");
  image.src = product.image;
  image.width = 400;
  image.height = 500;
  image.alt = product.title;

  const hover = document.createElement("span");
  hover.className = "product-card__hover";
  hover.textContent = "View product";

  link.append(image, hover);

  const title = document.createElement("h3");
  title.textContent = product.title;

  const category = document.createElement("p");
  category.className = "product-card__category";
  category.textContent = product.category;

  article.append(link, title, category, renderPrice(product));
  item.append(article);
  return item;
}

function renderProductLists(products) {
  const catalog = document.querySelector("[data-catalog]");
  const bestsellers = document.querySelector("[data-bestsellers]");

  if (catalog) {
    catalog.replaceChildren(...products.map(renderCard));
  }

  if (bestsellers) {
    const featured = products.filter((product) => product.bestseller);
    bestsellers.replaceChildren(...featured.map(renderCard));
  }
}

function showCatalogError(error) {
  const message = "Could not load /api/products. Start a backend from stage-06-server.";
  document.querySelectorAll("[data-catalog], [data-bestsellers]").forEach((list) => {
    setListStatus(list, message, true);
  });
  console.error(error);
}

async function loadProducts() {
  PRODUCTS = await api("/api/products");
  return PRODUCTS;
}
