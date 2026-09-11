import { api } from "./api.js";
import { UserSession } from "./UserSession.js";

const session = new UserSession();
const list = document.querySelector("[data-purchases]");

function money(value) {
  return "$" + Number(value).toFixed(2);
}

async function render() {
  await session.refresh();
  if (!session.isLoggedIn) {
    list.innerHTML = "<li>Sign in to see purchases.</li>";
    return;
  }
  const orders = await api("/api/purchases");
  if (!orders.length) {
    list.innerHTML = "<li>No purchases yet.</li>";
    return;
  }
  list.replaceChildren(
    ...orders.map((order) => {
      const li = document.createElement("li");
      li.className = "purchase";
      const lines = order.items
        .map((item) => item.title + " × " + item.quantity + " — " + money(item.lineTotal))
        .join("<br>");
      li.innerHTML =
        "<h3>Order #" + order.id + "</h3><p>" + order.createdAt + "</p><p>" + lines +
        "</p><p><strong>Total " + money(order.total) + "</strong></p>";
      return li;
    })
  );
}

render();
