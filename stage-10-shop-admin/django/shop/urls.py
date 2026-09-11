from django.urls import path
from . import views

urlpatterns = [
    path("products", views.products),
    path("products/<str:product_id>", views.product_detail),
    path("auth/register", views.register),
    path("auth/login", views.login_view),
    path("auth/logout", views.logout_view),
    path("me", views.me),
    path("orders", views.orders),
    path("cart", views.cart),
    path("cart/update", views.cart_update),
    path("checkout", views.checkout),
    path("purchases", views.purchases),
    path("admin/products", views.admin_products),
]
