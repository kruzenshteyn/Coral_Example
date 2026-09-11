const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const dbPath = path.join(__dirname, "data", "coral.db");
const schemaPath = path.join(__dirname, "..", "data", "schema.sql");
const productsPath = path.join(__dirname, "..", "data", "products.json");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `pbkdf2$${salt}$${digest}`;
}

function checkPassword(password, stored) {
  try {
    const parts = String(stored).split("$");
    if (parts.length !== 3 || parts[0] !== "pbkdf2") return false;
    const digest = crypto.pbkdf2Sync(password, parts[1], 120000, 32, "sha256");
    const actual = Buffer.from(parts[2], "hex");
    if (digest.length !== actual.length) return false;
    return crypto.timingSafeEqual(digest, actual);
  } catch (error) {
    return false;
  }
}

function productToApi(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    price: Number(row.price),
    oldPrice: row.old_price == null ? null : Number(row.old_price),
    image: row.image,
    badge: row.badge,
    bestseller: Number(row.bestseller) === 1,
    description: row.description,
  };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: Number(user.is_admin) === 1,
  };
}

function openDb() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(fs.readFileSync(schemaPath, "utf8"));
  seedProducts(db);
  seedAdmin(db);
  return db;
}

function seedProducts(db) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
  if (count > 0) return;
  const rows = JSON.parse(fs.readFileSync(productsPath, "utf8"));
  const insert = db.prepare(
    `INSERT INTO products (id, title, category, price, old_price, image, badge, bestseller, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of rows) {
    insert.run(
      row.id,
      row.title,
      row.category,
      row.price,
      row.oldPrice ?? null,
      row.image,
      row.badge ?? null,
      row.bestseller ? 1 : 0,
      row.description || ""
    );
  }
}

function seedAdmin(db) {
  const found = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@coral.local");
  if (found) return;
  db.prepare("INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, 1)").run(
    "Admin",
    "admin@coral.local",
    hashPassword("admin123")
  );
}

const db = openDb();

function loadProducts() {
  return db.prepare("SELECT * FROM products ORDER BY title").all().map(productToApi);
}

function findProduct(id) {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  return row ? productToApi(row) : null;
}

function findUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE lower(email) = lower(?)").get(email) || null;
}

function findUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) || null;
}

function createUser(name, email, password) {
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, 0)")
    .run(name, email, hashPassword(password));
  return findUserById(result.lastInsertRowid);
}

function listSelected(userId) {
  return db
    .prepare("SELECT id, product_id, created_at FROM selected_products WHERE user_id = ? ORDER BY id")
    .all(userId)
    .map((row) => ({
      id: row.id,
      productId: row.product_id,
      createdAt: row.created_at,
    }));
}

function addSelected(userId, productId) {
  const existing = db
    .prepare("SELECT id, product_id, created_at FROM selected_products WHERE user_id = ? AND product_id = ?")
    .get(userId, productId);
  if (existing) {
    return { id: existing.id, productId: existing.product_id, createdAt: existing.created_at };
  }
  const createdAt = new Date().toISOString();
  const result = db
    .prepare("INSERT INTO selected_products (user_id, product_id, created_at) VALUES (?, ?, ?)")
    .run(userId, productId, createdAt);
  return { id: result.lastInsertRowid, productId, createdAt };
}

function listCart(userId) {
  return db
    .prepare(
      `SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.image
       FROM cart_items c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ? ORDER BY c.id`
    )
    .all(userId)
    .map((row) => ({
      id: row.id,
      productId: row.product_id,
      quantity: row.quantity,
      title: row.title,
      price: Number(row.price),
      image: row.image,
      lineTotal: Number(row.price) * row.quantity,
    }));
}

function addToCart(userId, productId, quantity) {
  quantity = Math.max(1, quantity);
  const found = db.prepare("SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?").get(userId, productId);
  if (found) {
    db.prepare("UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?").run(
      quantity,
      userId,
      productId
    );
  } else {
    db.prepare("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)").run(
      userId,
      productId,
      quantity
    );
  }
  return listCart(userId).find((item) => item.productId === productId);
}

function setCartQuantity(userId, productId, quantity) {
  if (quantity < 1) {
    db.prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?").run(userId, productId);
    return;
  }
  db.prepare("UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?").run(
    quantity,
    userId,
    productId
  );
}

function getOrder(userId, orderId) {
  const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(orderId, userId);
  if (!order) return null;
  const lines = db.prepare("SELECT product_id, title, quantity, price FROM order_items WHERE order_id = ?").all(orderId);
  let total = 0;
  const items = lines.map((line) => {
    const lineTotal = Number(line.price) * line.quantity;
    total += lineTotal;
    return {
      productId: line.product_id,
      title: line.title,
      quantity: line.quantity,
      price: Number(line.price),
      lineTotal,
    };
  });
  return { id: order.id, createdAt: order.created_at, items, total };
}

function checkout(userId) {
  const items = listCart(userId);
  if (!items.length) return null;
  const createdAt = new Date().toISOString();
  const result = db.prepare("INSERT INTO orders (user_id, created_at) VALUES (?, ?)").run(userId, createdAt);
  const orderId = result.lastInsertRowid;
  const insert = db.prepare(
    "INSERT INTO order_items (order_id, product_id, title, quantity, price) VALUES (?, ?, ?, ?, ?)"
  );
  for (const item of items) {
    insert.run(orderId, item.productId, item.title, item.quantity, item.price);
  }
  db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(userId);
  return getOrder(userId, orderId);
}

function listPurchases(userId) {
  return db
    .prepare("SELECT id FROM orders WHERE user_id = ? ORDER BY id DESC")
    .all(userId)
    .map((row) => getOrder(userId, row.id));
}

function slugId(title) {
  const slug = String(title || "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "product";
  return slug + "-" + Date.now().toString(36).slice(-4);
}

function createProduct(body) {
  const id = slugId(body.title);
  db.prepare(
    `INSERT INTO products (id, title, category, price, old_price, image, badge, bestseller, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    String(body.title || "").trim(),
    String(body.category || "Dress").trim(),
    Number(body.price || 0),
    body.oldPrice == null ? null : Number(body.oldPrice),
    String(body.image || "/assets/images/product-green-dress.jpg").trim(),
    body.badge || null,
    body.bestseller ? 1 : 0,
    String(body.description || "").trim()
  );
  return findProduct(id);
}

module.exports = {
  checkPassword,
  publicUser,
  loadProducts,
  findProduct,
  findUserByEmail,
  findUserById,
  createUser,
  listSelected,
  addSelected,
  listCart,
  addToCart,
  setCartQuantity,
  checkout,
  listPurchases,
  createProduct,
};
