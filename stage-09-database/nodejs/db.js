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
};
