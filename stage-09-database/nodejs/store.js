const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const productsFile = path.join(__dirname, "..", "data", "products.json");
const storeFile = path.join(__dirname, "data", "store.json");

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function loadProducts() {
  const data = readJson(productsFile, []);
  return Array.isArray(data) ? data : [];
}

function loadStore() {
  const store = readJson(storeFile, {});
  if (!Array.isArray(store.users)) store.users = [];
  if (!Array.isArray(store.orders)) store.orders = [];
  return store;
}

function saveStore(store) {
  fs.mkdirSync(path.dirname(storeFile), { recursive: true });
  fs.writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

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

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function findProduct(id) {
  return loadProducts().find((product) => product.id === id) || null;
}

function findUserByEmail(store, email) {
  const needle = email.toLowerCase();
  return store.users.find((user) => user.email.toLowerCase() === needle) || null;
}

function findUserById(store, id) {
  return store.users.find((user) => user.id === id) || null;
}

module.exports = {
  loadProducts,
  loadStore,
  saveStore,
  hashPassword,
  checkPassword,
  publicUser,
  findProduct,
  findUserByEmail,
  findUserById,
};
