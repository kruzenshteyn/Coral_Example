const path = require("path");
const express = require("express");
const session = require("express-session");
const store = require("./db");

const app = express();
const port = process.env.PORT || 8002;
const frontendDir = path.join(__dirname, "..", "frontend");
const assetsDir = path.join(__dirname, "..", "..", "assets");

app.use(express.json());
app.use(function (err, _req, res, next) {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }
  return next(err);
});
app.use(
  session({
    secret: "coral-course-not-for-production",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true },
  })
);

function ok(res, data, status) {
  return res.status(status || 200).json({ ok: true, data: data });
}

function fail(res, message, status) {
  return res.status(status || 400).json({ ok: false, error: message });
}

function requireUser(req, res) {
  const user = store.findUserById(req.session.userId);
  if (!user) {
    fail(res, "Unauthorized", 401);
    return null;
  }
  return user;
}

app.get("/api/products", (_req, res) => ok(res, store.loadProducts()));

app.get("/api/products/:id", (req, res) => {
  const product = store.findProduct(req.params.id);
  if (!product) return fail(res, "Product not found", 404);
  return ok(res, product);
});

app.post("/api/auth/register", (req, res) => {
  const name = String((req.body && req.body.name) || "").trim();
  const email = String((req.body && req.body.email) || "").trim();
  const password = String((req.body && req.body.password) || "");
  if (name.length < 2 || !email.includes("@") || password.length < 6) {
    return fail(res, "Invalid registration data", 400);
  }
  if (store.findUserByEmail(email)) {
    return fail(res, "Email already registered", 409);
  }
  const user = store.createUser(name, email, password);
  req.session.userId = user.id;
  return ok(res, store.publicUser(user));
});

app.post("/api/auth/login", (req, res) => {
  const email = String((req.body && req.body.email) || "").trim();
  const password = String((req.body && req.body.password) || "");
  const user = store.findUserByEmail(email);
  if (!user || !store.checkPassword(password, user.password_hash)) {
    return fail(res, "Invalid email or password", 401);
  }
  req.session.userId = user.id;
  return ok(res, store.publicUser(user));
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => ok(res, null));
});

app.get("/api/me", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  return ok(res, store.publicUser(user));
});

app.get("/api/orders", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  return ok(res, store.listSelected(user.id));
});

app.post("/api/orders", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const productId = String((req.body && req.body.productId) || "");
  if (!store.findProduct(productId)) return fail(res, "Product not found", 404);
  return ok(res, store.addSelected(user.id, productId));
});

function requireAdmin(req, res) {
  const user = requireUser(req, res);
  if (!user) return null;
  if (Number(user.is_admin) !== 1) {
    fail(res, "Forbidden", 403);
    return null;
  }
  return user;
}

app.get("/api/cart", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  return ok(res, store.listCart(user.id));
});

app.post("/api/cart", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const productId = String((req.body && req.body.productId) || "");
  const quantity = Number((req.body && req.body.quantity) || 1);
  if (!store.findProduct(productId)) return fail(res, "Product not found", 404);
  return ok(res, store.addToCart(user.id, productId, quantity));
});

app.post("/api/cart/update", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const productId = String((req.body && req.body.productId) || "");
  const quantity = Number((req.body && req.body.quantity) || 0);
  store.setCartQuantity(user.id, productId, quantity);
  return ok(res, store.listCart(user.id));
});

app.post("/api/checkout", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const order = store.checkout(user.id);
  if (!order) return fail(res, "Cart is empty", 400);
  return ok(res, order);
});

app.get("/api/purchases", (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  return ok(res, store.listPurchases(user.id));
});

app.post("/api/admin/products", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const title = String((req.body && req.body.title) || "").trim();
  const price = Number((req.body && req.body.price) || 0);
  if (!title || price <= 0) return fail(res, "Title and price are required", 400);
  return ok(res, store.createProduct(req.body || {}));
});

app.use("/assets", express.static(assetsDir));
app.use(express.static(frontendDir));

app.listen(port, () => {
  console.log("CORAL Node.js + SQLite http://localhost:" + port);
});
