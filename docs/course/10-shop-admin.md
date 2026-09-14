# Этап 10. Покупки и админка

Корзина, заказ и права — во [вводной лекции](lectures/10-shop-admin/lecture.md), живые примеры: [lectures/10-shop-admin/examples.html](lectures/10-shop-admin/examples.html).

Папка: `stage-10-shop-admin/`.

Поверх SQLite из этапа 9:

- корзина (`cart_items`)
- оформление заказа (`orders` + `order_items`)
- админка: форма новой карточки (`POST /api/admin/products`)

## Новые URL API

| Метод | Путь | Кто |
| --- | --- | --- |
| GET/POST | `/api/cart` | пользователь |
| POST | `/api/cart/update` | `{ productId, quantity }` (0 — удалить) |
| POST | `/api/checkout` | заказ из корзины |
| GET | `/api/purchases` | история покупок |
| POST | `/api/admin/products` | только `is_admin` |

## Страницы

- `index.html` — витрина, **Add to cart**
- `cart.html` — количество и Checkout
- `purchases.html` — мои заказы
- `admin.html` — новая карточка

Админ: `admin@coral.local` / `admin123`. Ссылка Admin в шапке видна только ему.

## Сценарий занятия

1. Войти как обычный пользователь, положить товар в корзину, Checkout, открыть Orders.
2. Выйти, войти как админ, добавить карточку, обновить витрину — товар из БД.
