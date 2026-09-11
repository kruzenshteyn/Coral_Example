import json
import mimetypes
from datetime import datetime, timezone
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from . import store


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


def current_user(request):
    db = store.load_store()
    user = store.find_user_by_id(db, request.session.get("user_id"))
    return db, user


def require_user(request):
    db, user = current_user(request)
    if not user:
        return None, None, fail("Unauthorized", 401)
    return db, user, None


@require_http_methods(["GET"])
def products(request):
    return ok(store.load_products())


@require_http_methods(["GET"])
def product_detail(request, product_id):
    product = store.find_product(product_id)
    if not product:
        return fail("Product not found", 404)
    return ok(product)


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    body = read_body(request)
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""
    if len(name) < 2 or "@" not in email or len(password) < 6:
        return fail("Invalid registration data", 400)
    db = store.load_store()
    if store.find_user_by_email(db, email):
        return fail("Email already registered", 409)
    user = {
        "id": len(db["users"]) + 1,
        "name": name,
        "email": email,
        "password_hash": store.hash_password(password),
    }
    db["users"].append(user)
    store.save_store(db)
    request.session["user_id"] = user["id"]
    return ok(store.public_user(user))


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    body = read_body(request)
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""
    db = store.load_store()
    user = store.find_user_by_email(db, email)
    if not user or not store.check_password(password, user["password_hash"]):
        return fail("Invalid email or password", 401)
    request.session["user_id"] = user["id"]
    return ok(store.public_user(user))


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    request.session.flush()
    return ok(None)


@require_http_methods(["GET"])
def me(request):
    _db, user, error = require_user(request)
    if error:
        return error
    return ok(store.public_user(user))


@csrf_exempt
@require_http_methods(["GET", "POST"])
def orders(request):
    db, user, error = require_user(request)
    if error:
        return error

    if request.method == "GET":
        items = [
            {
                "id": order["id"],
                "productId": order["product_id"],
                "createdAt": order["created_at"],
            }
            for order in db["orders"]
            if order["user_id"] == user["id"]
        ]
        return ok(items)

    product_id = str(read_body(request).get("productId") or "")
    if not store.find_product(product_id):
        return fail("Product not found", 404)
    for order in db["orders"]:
        if order["user_id"] == user["id"] and order["product_id"] == product_id:
            return ok(
                {
                    "id": order["id"],
                    "productId": order["product_id"],
                    "createdAt": order["created_at"],
                }
            )
    order = {
        "id": len(db["orders"]) + 1,
        "user_id": user["id"],
        "product_id": product_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db["orders"].append(order)
    store.save_store(db)
    return ok(
        {
            "id": order["id"],
            "productId": order["product_id"],
            "createdAt": order["created_at"],
        }
    )


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
