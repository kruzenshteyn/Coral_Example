# Инструкция. Этап 10 — покупки и админка

## Зачем этап

«Выбрать товар» — не магазин. Нужны корзина с количеством, фиксация заказа (снимок цены), разные права: покупатель и админ.

## Папка

`stage-10-shop-admin/`  
Запускайте **этот** сервер, не этап 6/9.

## Теория

- Снова [401](https://developer.mozilla.org/ru/docs/Web/HTTP/Reference/Status/401) vs [403](https://developer.mozilla.org/ru/docs/Web/HTTP/Reference/Status/403): не вошёл / вошёл, но не админ
- [Аутентификация vs авторизация](https://developer.mozilla.org/ru/docs/Glossary/Authentication) и [Authorization](https://developer.mozilla.org/en-US/docs/Glossary/Authorization)
- [XSS](https://developer.mozilla.org/ru/docs/Web/Security/Attacks/XSS) — название товара из админки не вставлять через сырой `innerHTML` без экранирования
- [CSRF](https://developer.mozilla.org/ru/docs/Web/Security/Attacks/CSRF) — POST checkout с cookie
- Транзакция checkout: идея «все или ничего» — [SQLite transactions](https://www.sqlite.org/lang_transaction.html)
- CRUD: [MDN HTTP POST](https://developer.mozilla.org/ru/docs/Web/HTTP/Reference/Methods/POST) создаёт ресурс (карточка, заказ)

## Почему так

| Решение | Почему | Не берём |
| --- | --- | --- |
| Таблицы `cart_items` и `orders` + `order_items` | Корзина меняется; заказ — снимок | Одна таблица «всё подряд» |
| Цена копируется в `order_items.price` | Админ завтра сменит цену на витрине | JOIN к `products.price` в истории заказов |
| `quantity = 0` удаляет строку корзины | Один эндпоинт update | Отдельный DELETE без договорённости (можно, но на курсе один POST update) |
| Checkout в транзакции | Не оставить «заказ без позиций» / «корзина очищена, заказа нет» | Два запроса без BEGIN |
| Своя страница `admin.html`, не Django Admin | Три стека одинаковы для студента | Только `/admin` Django |
| Роль `is_admin` в `users` | 403 на POST карточки | Прятать форму CSS-ом и считать это защитой |
| Add to cart, не только «избранное» | Сценарий покупки | localStorage-корзина в обход API |

Сид админа с этапа 9: `admin@coral.local` / `admin123`.

## Пошагово

1. Сервер из `stage-10-shop-admin` (пример Node):

```powershell
cd stage-10-shop-admin\nodejs
npm install
npm start
```

Откройте http://localhost:8002/ (или порт из README).

2. **Покупатель.** Зарегистрируйте обычный email. Карточка → Add to cart. Шапка: бейдж количества.
3. `cart.html` — измените qty, `0` убирает строку. Checkout. Сообщение с номером заказа.
4. `purchases.html` — тот же заказ, сумма = Σ (цена × количество).
5. Log out.
6. **Админ.** Вход `admin@coral.local` / `admin123`. В шапке ссылка Admin (её рисует JS по `isAdmin` из `/api/me`).
7. `admin.html`: title, price > 0, URL картинки из `/assets/images/…`. Create card.
8. Главная: новая карточка из БД.
9. Проверка прав (curl, сессия обычного пользователя):

```text
POST /api/admin/products  →  403 Forbidden
GET  /api/cart без cookie →  401
POST /api/checkout с пустой корзиной → 400
```

## Пример: снимок цены

```text
Витрина: худи $155
Покупатель оформляет 2 шт. → order_items.price = 155
Админ меняет карточку на $199
История заказа всё ещё 2 × 155
```

Иначе вчерашние чеки «плывут».

## Пример: 401 и 403

```text
Нет cookie          → 401 (кто вы?)
Есть cookie, is_admin=0, POST /api/admin/products → 403 (вам нельзя)
```

Не подменяйте 403 на 404 «чтобы скрыть админку»: для учебного API честный код проще отлаживать. В проде иногда скрывают — это отдельная дискуссия.

## Проверка

Две роли на одном стеке. Корзина пустеет после checkout. Новая карточка видна гостю на витрине.

Тест: [../tests/10-shop-admin.md](../tests/10-shop-admin.md)
