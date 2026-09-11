import json
import mimetypes
from datetime import datetime, timezone
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

import re

from .models import CartItem, Order, OrderItem, Product, SelectedProduct, User
from .passwords import check_password, hash_password


def ok(data, status=200):
    return JsonResponse({"ok": True, "data": data}, status=status)


def fail(message, status=400):
    return JsonResponse({"ok": False, "error": message}, status=status)


def read_body(request):
    if not request.body:
        return {}
    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def require_user(request):
    user_id = request.session.get("user_id")
    if not user_id:
        return None, fail("Unauthorized", 401)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        request.session.flush()
        return None, fail("Unauthorized", 401)
    return user, None


@require_http_methods(["GET"])
def products(request):
    return ok([item.to_api() for item in Product.objects.all().order_by("title")])


@require_http_methods(["GET"])
def product_detail(request, product_id):
    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return fail("Product not found", 404)
    return ok(product.to_api())


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    body = read_body(request)
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""
    if len(name) < 2 or "@" not in email or len(password) < 6:
        return fail("Invalid registration data", 400)
    if User.objects.filter(email__iexact=email).exists():
        return fail("Email already registered", 409)
    user = User.objects.create(
        name=name,
        email=email,
        password_hash=hash_password(password),
        is_admin=False,
    )
    request.session["user_id"] = user.id
    return ok(user.to_api())


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    body = read_body(request)
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""
    user = User.objects.filter(email__iexact=email).first()
    if not user or not check_password(password, user.password_hash):
        return fail("Invalid email or password", 401)
    request.session["user_id"] = user.id
    return ok(user.to_api())


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    request.session.flush()
    return ok(None)


@require_http_methods(["GET"])
def me(request):
    user, error = require_user(request)
    if error:
        return error
    return ok(user.to_api())


@csrf_exempt
@require_http_methods(["GET", "POST"])
def orders(request):
    user, error = require_user(request)
    if error:
        return error

    if request.method == "GET":
        items = SelectedProduct.objects.filter(user=user).order_by("id")
        return ok([item.to_api() for item in items])

    product_id = str(read_body(request).get("productId") or "")
    product = Product.objects.filter(pk=product_id).first()
    if not product:
        return fail("Product not found", 404)
    item, _created = SelectedProduct.objects.get_or_create(
        user=user,
        product=product,
        defaults={"created_at": datetime.now(timezone.utc).isoformat()},
    )
    return ok(item.to_api())


def require_admin(request):
    user, error = require_user(request)
    if error:
        return None, error
    if not user.is_admin:
        return None, fail("Forbidden", 403)
    return user, None


@csrf_exempt
@require_http_methods(["GET", "POST"])
def cart(request):
    user, error = require_user(request)
    if error:
        return error
    if request.method == "GET":
        items = CartItem.objects.filter(user=user).select_related("product").order_by("id")
        return ok([item.to_api() for item in items])
    body = read_body(request)
    product_id = str(body.get("productId") or "")
    quantity = int(body.get("quantity") or 1)
    product = Product.objects.filter(pk=product_id).first()
    if not product:
        return fail("Product not found", 404)
    item, created = CartItem.objects.get_or_create(
        user=user, product=product, defaults={"quantity": max(1, quantity)}
    )
    if not created:
        item.quantity += max(1, quantity)
        item.save()
    return ok(item.to_api())


@csrf_exempt
@require_http_methods(["POST"])
def cart_update(request):
    user, error = require_user(request)
    if error:
        return error
    body = read_body(request)
    product_id = str(body.get("productId") or "")
    quantity = int(body.get("quantity") or 0)
    if quantity < 1:
        CartItem.objects.filter(user=user, product_id=product_id).delete()
    else:
        CartItem.objects.filter(user=user, product_id=product_id).update(quantity=quantity)
    items = CartItem.objects.filter(user=user).select_related("product").order_by("id")
    return ok([item.to_api() for item in items])


@csrf_exempt
@require_http_methods(["POST"])
def checkout(request):
    user, error = require_user(request)
    if error:
        return error
    cart_items = list(CartItem.objects.filter(user=user).select_related("product"))
    if not cart_items:
        return fail("Cart is empty", 400)
    order = Order.objects.create(user=user, created_at=datetime.now(timezone.utc).isoformat())
    for item in cart_items:
        OrderItem.objects.create(
            order=order,
            product_id=item.product_id,
            title=item.product.title,
            quantity=item.quantity,
            price=item.product.price,
        )
    CartItem.objects.filter(user=user).delete()
    return ok(order.to_api())


@require_http_methods(["GET"])
def purchases(request):
    user, error = require_user(request)
    if error:
        return error
    orders = Order.objects.filter(user=user).prefetch_related("items").order_by("-id")
    return ok([order.to_api() for order in orders])


@csrf_exempt
@require_http_methods(["POST"])
def admin_products(request):
    _admin, error = require_admin(request)
    if error:
        return error
    body = read_body(request)
    title = str(body.get("title") or "").strip()
    price = float(body.get("price") or 0)
    if not title or price <= 0:
        return fail("Title and price are required", 400)
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:40] or "product"
    product_id = slug + "-" + datetime.now(timezone.utc).strftime("%H%M%S")
    product = Product.objects.create(
        id=product_id,
        title=title,
        category=str(body.get("category") or "Dress").strip(),
        price=price,
        old_price=body.get("oldPrice"),
        image=str(body.get("image") or "/assets/images/product-green-dress.jpg").strip(),
        badge=body.get("badge"),
        bestseller=bool(body.get("bestseller")),
        description=str(body.get("description") or "").strip(),
    )
    return ok(product.to_api())


def _safe_file(root: Path, relative: str):
    root = root.resolve()
    target = (root / relative).resolve()
    if not target.is_relative_to(root) or not target.is_file():
        raise Http404("Not found")
    return target


def asset_file(request, path):
    file_path = _safe_file(settings.ASSETS_DIR, path)
    content_type, _encoding = mimetypes.guess_type(str(file_path))
    return FileResponse(file_path.open("rb"), content_type=content_type or "application/octet-stream")


def frontend_file(request, path=""):
    relative = path or "index.html"
    file_path = _safe_file(settings.FRONTEND_DIR, relative)
    content_type, _encoding = mimetypes.guess_type(str(file_path))
    return FileResponse(file_path.open("rb"), content_type=content_type or "application/octet-stream")
