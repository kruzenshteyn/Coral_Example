(function () {
  const authModal = document.getElementById("modal-auth");
  const productModal = document.getElementById("modal-product");
  const menu = document.querySelector(".menu");
  const burger = document.querySelector(".burger");
  const cartCount = document.querySelector("[data-cart-count]");
  const accountLabel = document.querySelector("[data-account-label]");
  const logoutButton = document.querySelector("[data-logout]");

  const productTitle = document.getElementById("product-modal-title");
  const productCategory = document.getElementById("product-modal-category");
  const productPrice = document.getElementById("product-modal-price");
  const productImage = document.getElementById("product-modal-image");
  const productText = productModal && productModal.querySelector(".modal__text");
  const selectButton = document.querySelector("[data-select-product]");

  let activeProductId = null;
  let lastFocus = null;
  let currentUser = null;
  let selectedIds = [];

  function money(value) {
    return "$" + Number(value).toFixed(2);
  }

  function setUser(user) {
    currentUser = user;
    if (accountLabel) {
      accountLabel.textContent = user ? user.name || user.email : "Account";
    }
    if (logoutButton) {
      logoutButton.hidden = !user;
    }
  }

  function renderSelected() {
    document.querySelectorAll(".product-card[data-product-id]").forEach((card) => {
      card.classList.toggle("product-card_selected", selectedIds.includes(card.dataset.productId));
    });
    if (cartCount) {
      cartCount.textContent = String(selectedIds.length);
      cartCount.hidden = selectedIds.length === 0;
    }
    if (selectButton && activeProductId) {
      selectButton.textContent = selectedIds.includes(activeProductId)
        ? "Selected"
        : "Select product";
    }
  }

  function openModal(modal) {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add("modal_open");
    document.body.classList.add("modal-open");
    const focusable = modal.querySelector("button, [href], input, select, textarea");
    if (focusable) focusable.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("modal_open");
    if (!document.querySelector(".modal_open")) {
      document.body.classList.remove("modal-open");
    }
    if (window.location.hash === "#" + modal.id) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function closeAll() {
    document.querySelectorAll(".modal_open").forEach(closeModal);
  }

  function fillProductModal(product) {
    activeProductId = product.id;
    if (productTitle) productTitle.textContent = product.title;
    if (productCategory) productCategory.textContent = product.category;
    if (productImage) {
      productImage.src = product.image;
      productImage.alt = product.title;
    }
    if (productPrice) {
      const old = product.oldPrice
        ? "<s><data value=\"" + product.oldPrice + "\">" + money(product.oldPrice) + "</data></s> "
        : "";
      productPrice.innerHTML =
        old + "<data value=\"" + product.price + "\">" + money(product.price) + "</data>";
    }
    if (productText) productText.textContent = product.description;
    renderSelected();
  }

  function findProduct(id) {
    return PRODUCTS.find((item) => item.id === id);
  }

  async function refreshSession() {
    try {
      const user = await api("/api/me");
      setUser(user);
      const orders = await api("/api/orders");
      selectedIds = orders.map((order) => order.productId);
    } catch (error) {
      setUser(null);
      selectedIds = [];
    }
    renderSelected();
  }

  document.addEventListener("click", (event) => {
    const accountLink = event.target.closest('a[href="#modal-auth"]');
    if (accountLink) {
      event.preventDefault();
      openModal(authModal);
      return;
    }

    const productLink = event.target.closest(".product-card__media");
    if (productLink) {
      const card = productLink.closest("[data-product-id]");
      const product = card && findProduct(card.dataset.productId);
      if (product) {
        event.preventDefault();
        fillProductModal(product);
        openModal(productModal);
      }
      return;
    }

    if (event.target.closest(".modal__close, .modal__overlay")) {
      event.preventDefault();
      closeModal(event.target.closest(".modal"));
      return;
    }

    const tabBtn = event.target.closest("[data-tab]");
    if (tabBtn) {
      const tab = tabBtn.dataset.tab;
      document.querySelectorAll(".modal-tabs__btn").forEach((btn) => {
        btn.classList.toggle("modal-tabs__btn_active", btn === tabBtn);
      });
      document.getElementById("form-signin").classList.toggle("form_hidden", tab !== "signin");
      document.getElementById("form-register").classList.toggle("form_hidden", tab !== "register");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAll();
  });

  if (selectButton) {
    selectButton.addEventListener("click", async () => {
      if (!activeProductId) return;
      if (!currentUser) {
        closeModal(productModal);
        openModal(authModal);
        return;
      }
      try {
        await api("/api/orders", { method: "POST", body: { productId: activeProductId } });
        if (!selectedIds.includes(activeProductId)) selectedIds.push(activeProductId);
        renderSelected();
      } catch (error) {
        if (error.status === 401) {
          setUser(null);
          closeModal(productModal);
          openModal(authModal);
        }
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await api("/api/auth/logout", { method: "POST", body: {} });
      } catch (error) {
        /* session already gone */
      }
      setUser(null);
      selectedIds = [];
      renderSelected();
    });
  }

  function showError(input, show, message) {
    input.classList.toggle("is-invalid", show);
    const error = input.parentElement.querySelector(".form__error");
    if (error) {
      if (message) error.textContent = message;
      error.classList.toggle("is-visible", show);
    }
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  const signinForm = document.getElementById("form-signin");
  if (signinForm) {
    signinForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = signinForm.querySelector("#auth-email");
      const password = signinForm.querySelector("#auth-password");
      const emailBad = !isEmail(email.value);
      const passBad = password.value.length < 6;
      showError(email, emailBad);
      showError(password, passBad);
      if (emailBad || passBad) return;
      try {
        const user = await api("/api/auth/login", {
          method: "POST",
          body: { email: email.value, password: password.value },
        });
        setUser(user);
        signinForm.querySelector(".form__status").classList.add("is-visible");
        await refreshSession();
        setTimeout(() => closeModal(authModal), 600);
      } catch (error) {
        showError(password, true, error.message);
      }
    });
  }

  const registerForm = document.getElementById("form-register");
  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = registerForm.querySelector("#reg-name");
      const email = registerForm.querySelector("#reg-email");
      const password = registerForm.querySelector("#reg-password");
      const repeat = registerForm.querySelector("#reg-password-repeat");
      const nameBad = name.value.trim().length < 2;
      const emailBad = !isEmail(email.value);
      const passBad = password.value.length < 6;
      const repeatBad = password.value !== repeat.value;
      showError(name, nameBad);
      showError(email, emailBad);
      showError(password, passBad);
      showError(repeat, repeatBad);
      if (nameBad || emailBad || passBad || repeatBad) return;
      try {
        const user = await api("/api/auth/register", {
          method: "POST",
          body: {
            name: name.value.trim(),
            email: email.value,
            password: password.value,
          },
        });
        setUser(user);
        registerForm.querySelector(".form__status").classList.add("is-visible");
        await refreshSession();
        setTimeout(() => closeModal(authModal), 600);
      } catch (error) {
        showError(email, true, error.message);
      }
    });
  }

  if (burger && menu) {
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  document.querySelectorAll(".bestsellers .tabs a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const filter = link.textContent.trim().toLowerCase();
      document.querySelectorAll(".bestsellers .tabs a").forEach((item) => {
        item.classList.toggle("tabs__link_active", item === link);
      });
      document.querySelectorAll(".bestsellers .product-card").forEach((card) => {
        const category = (card.querySelector(".product-card__category") || {}).textContent || "";
        const show = filter === "all products" || category.toLowerCase() === filter;
        card.closest("li").hidden = !show;
      });
    });
  });

  loadProducts()
    .then(async (products) => {
      renderProductLists(products);
      await refreshSession();
    })
    .catch(showCatalogError);
})();
