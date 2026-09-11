const path = require("path");
const express = require("express");
const session = require("express-session");
const store = require("./store");

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
  const db = store.loadStore();
  const user = store.findUserById(db, req.session.userId);
  if (!user) {
    fail(res, "Unauthorized", 401);
    return null;
  }
  return { db, user };
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
  const db = store.loadStore();
  if (store.findUserByEmail(db, email)) {
    return fail(res, "Email already registered", 409);
  }
  const user = {
    id: db.users.length + 1,
    name,
    email,
    password_hash: store.hashPassword(password),
  };
  db.users.push(user);
  store.saveStore(db);
  req.session.userId = user.id;
  return ok(res, store.publicUser(user));
});

app.post("/api/auth/login", (req, res) => {
  const email = String((req.body && req.body.email) || "").trim();
  const password = String((req.body && req.body.password) || "");
  const db = store.loadStore();
  const user = store.findUserByEmail(db, email);
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
  const auth = requireUser(req, res);
  if (!auth) return;
  return ok(res, store.publicUser(auth.user));
});

app.get("/api/orders", (req, res) => {
  const auth = requireUser(req, res);
  if (!auth) return;
  const items = auth.db.orders
    .filter((order) => order.user_id === auth.user.id)
    .map((order) => ({
      id: order.id,
      productId: order.product_id,
      createdAt: order.created_at,
    }));
  return ok(res, items);
});

app.post("/api/orders", (req, res) => {
  const auth = requireUser(req, res);
  if (!auth) return;
  const productId = String((req.body && req.body.productId) || "");
  if (!store.findProduct(productId)) return fail(res, "Product not found", 404);
  const existing = auth.db.orders.find(
    (order) => order.user_id === auth.user.id && order.product_id === productId
  );
  if (existing) {
    return ok(res, {
      id: existing.id,
      productId: existing.product_id,
      createdAt: existing.created_at,
    });
  }
  const order = {
    id: auth.db.orders.length + 1,
    user_id: auth.user.id,
    product_id: productId,
    created_at: new Date().toISOString(),
  };
  auth.db.orders.push(order);
  store.saveStore(auth.db);
  return ok(res, {
    id: order.id,
    productId: order.product_id,
    createdAt: order.created_at,
  });
});

app.use("/assets", express.static(assetsDir));
app.use(express.static(frontendDir));

app.listen(port, () => {
  console.log("CORAL Node.js http://localhost:" + port);
});
