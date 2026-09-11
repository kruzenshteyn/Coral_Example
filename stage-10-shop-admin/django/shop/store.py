import hashlib
import json
import secrets
from pathlib import Path

from django.conf import settings


def _read(path: Path, fallback):
    if not path.is_file():
        return fallback
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    return data if isinstance(data, list) or isinstance(data, dict) else fallback


def load_products():
    return _read(settings.PRODUCTS_FILE, [])


def load_store():
    store = _read(settings.STORE_FILE, {})
    store.setdefault("users", [])
    store.setdefault("orders", [])
    return store


def save_store(store):
    path = Path(settings.STORE_FILE)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(store, indent=2), encoding="utf-8")


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120000)
    return f"pbkdf2${salt}${digest.hex()}"


def check_password(password: str, stored: str) -> bool:
    try:
        algo, salt, digest = stored.split("$", 2)
    except ValueError:
        return False
    if algo != "pbkdf2":
        return False
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120000)
    return secrets.compare_digest(check.hex(), digest)


def public_user(user):
    return {"id": user["id"], "name": user["name"], "email": user["email"]}


def find_product(product_id: str):
    for product in load_products():
        if product.get("id") == product_id:
            return product
    return None


def find_user_by_email(store, email: str):
    email = email.lower()
    for user in store["users"]:
        if user["email"].lower() == email:
            return user
    return None


def find_user_by_id(store, user_id):
    for user in store["users"]:
        if user["id"] == user_id:
            return user
    return None
