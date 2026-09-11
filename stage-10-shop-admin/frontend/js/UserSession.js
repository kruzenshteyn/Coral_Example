import { api } from "./api.js";

export class UserSession {
  constructor() {
    this.current = null;
  }

  get isLoggedIn() {
    return Boolean(this.current);
  }

  get isAdmin() {
    return Boolean(this.current && this.current.isAdmin);
  }

  displayName() {
    if (!this.current) return "Account";
    return this.current.name || this.current.email || "Account";
  }

  async refresh() {
    try {
      this.current = await api("/api/me");
    } catch (error) {
      this.current = null;
    }
    return this.current;
  }

  async login(email, password) {
    this.current = await api("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    return this.current;
  }

  async register(name, email, password) {
    this.current = await api("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
    return this.current;
  }

  async logout() {
    try {
      await api("/api/auth/logout", { method: "POST", body: {} });
    } catch (error) {
      /* already logged out */
    }
    this.current = null;
  }
}
