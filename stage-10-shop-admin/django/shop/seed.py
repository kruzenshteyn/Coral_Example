import json
from pathlib import Path

from django.conf import settings

from .models import Product, User
from .passwords import hash_password


def ensure_seed():
    products_file = settings.PRODUCTS_FILE
    if not Product.objects.exists() and Path(products_file).is_file():
        rows = json.loads(Path(products_file).read_text(encoding="utf-8"))
        Product.objects.bulk_create(
            [
                Product(
                    id=row["id"],
                    title=row["title"],
                    category=row["category"],
                    price=row["price"],
                    old_price=row.get("oldPrice"),
                    image=row["image"],
                    badge=row.get("badge"),
                    bestseller=bool(row.get("bestseller")),
                    description=row.get("description") or "",
                )
                for row in rows
            ]
        )
    if not User.objects.filter(email="admin@coral.local").exists():
        User.objects.create(
            name="Admin",
            email="admin@coral.local",
            password_hash=hash_password("admin123"),
            is_admin=True,
        )
