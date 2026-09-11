import { api } from "./api.js";
import { UserSession } from "./UserSession.js";

const session = new UserSession();
const list = document.querySelector("[data-cart-list]");
const totalNode = document.querySelector("[data-cart-total]");
const checkoutBtn = document.querySelector("[data-checkout]");
const statusNode = document.querySelector("[data-cart-status]");

function money(value) {
  return "$" + Number(value).toFixed(2);
}

async function render() {
  await session.refresh();
  if (!session.isLoggedIn) {
    list.innerHTML = "<li>Sign in to see your cart.</li>";
    return;
  }
  const items = await api("/api/cart");
  if (!items.length) {
    list.innerHTML = "<li>Cart is empty.</li>";
    totalNode.textContent = money(0);
    return;
  }
  list.replaceChildren(
    ...items.map((item) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML =
        "<img src=\"" + item.image + "\" alt=\"\" width=\"80\" height=\"80\">" +
        "<div><h3>" + item.title + "</h3><p>" + money(item.price) + "</p></div>" +
        "<label>Qty <input type=\"number\" min=\"0\" value=\"" + item.quantity + "\" data-id=\"" +
        item.productId + "\"></label>" +
        "<p>" + money(item.lineTotal) + "</p>";
      return li;
    })
  );
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  totalNode.textContent = money(total);
}

list.addEventListener("change", async (event) => {
  const input = event.target.closest("input[data-id]");
  if (!input) return;
  await api("/api/cart/update", {
    method: "POST",
    body: { productId: input.dataset.id, quantity: Number(input.value) },
  });
  await render();
});

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", async () => {
    try {
      const order = await api("/api/checkout", { method: "POST", body: {} });
      statusNode.textContent = "Order #" + order.id + " placed. Total " + money(order.total);
      await render();
    } catch (error) {
      statusNode.textContent = error.message;
    }
  });
}

render();
