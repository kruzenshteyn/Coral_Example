from django.db import models


class User(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    is_admin = models.BooleanField(default=False)

    class Meta:
        db_table = "users"

    def to_api(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "isAdmin": bool(self.is_admin),
        }


class Product(models.Model):
    id = models.CharField(primary_key=True, max_length=64)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=80)
    price = models.FloatField()
    old_price = models.FloatField(null=True, blank=True)
    image = models.CharField(max_length=400)
    badge = models.CharField(max_length=20, null=True, blank=True)
    bestseller = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "products"

    def to_api(self):
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "price": self.price,
            "oldPrice": self.old_price,
            "image": self.image,
            "badge": self.badge,
            "bestseller": bool(self.bestseller),
            "description": self.description,
        }


class SelectedProduct(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, db_column="product_id")
    created_at = models.CharField(max_length=40)

    class Meta:
        db_table = "selected_products"
        unique_together = ("user", "product")

    def to_api(self):
        return {
            "id": self.id,
            "productId": self.product_id,
            "createdAt": self.created_at,
        }
