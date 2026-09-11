export class StorageBox {
  constructor(key, fallback) {
    this.key = key;
    this.fallback = fallback;
  }

  read() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : this.fallback;
    } catch (error) {
      return this.fallback;
    }
  }

  write(value) {
    localStorage.setItem(this.key, JSON.stringify(value));
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}
