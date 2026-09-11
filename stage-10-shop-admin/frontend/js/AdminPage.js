import { api } from "./api.js";
import { UserSession } from "./UserSession.js";
import { FormValidator } from "./FormValidator.js";

const session = new UserSession();
const form = document.querySelector("[data-admin-form]");
const statusNode = document.querySelector("[data-admin-status]");
const gate = document.querySelector("[data-admin-gate]");

await session.refresh();
if (!session.isAdmin) {
  gate.hidden = false;
  form.hidden = true;
} else {
  gate.hidden = true;
  form.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = form.querySelector("[name=title]");
  const price = form.querySelector("[name=price]");
  const okTitle = FormValidator.setError(title, title.value.trim().length < 2);
  const okPrice = FormValidator.setError(price, Number(price.value) <= 0);
  if (!okTitle || !okPrice) return;
  try {
    const product = await api("/api/admin/products", {
      method: "POST",
      body: {
        title: title.value.trim(),
        category: form.querySelector("[name=category]").value.trim() || "Dress",
        price: Number(price.value),
        image: form.querySelector("[name=image]").value.trim(),
        description: form.querySelector("[name=description]").value.trim(),
        bestseller: form.querySelector("[name=bestseller]").checked,
      },
    });
    statusNode.textContent = "Created " + product.title + " (" + product.id + ")";
    form.reset();
  } catch (error) {
    statusNode.textContent = error.message;
  }
});
