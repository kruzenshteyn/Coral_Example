import hashlib
import secrets


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
