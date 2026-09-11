import { StorageBox } from "./StorageBox.js";

export class UserSession {
  constructor(key) {
    this.storage = new StorageBox(key, null);
  }

  get current() {
    return this.storage.read();
  }

  get isLoggedIn() {
    return Boolean(this.current);
  }

  login(user) {
    this.storage.write(user);
  }

  logout() {
    this.storage.clear();
  }

  displayName() {
    const user = this.current;
    if (!user) return "Account";
    return user.name || user.email || "Account";
  }
}
