# Этап 9. База данных SQLite

Папка: `stage-09-database/`.

Вместо `store.json` — SQLite. Контракт HTTP тот же, что на этапе 6.

## Таблицы (`data/schema.sql`)

- `users` — имя, email, password_hash, is_admin
- `products` — карточки витрины
- `selected_products` — «выбрать товар» из этапа 6

Сиды: `data/products.json` + пользователь `admin@coral.local` / `admin123`.

## Как смотрят три стека

| Стек | Файл БД | Как пишем SQL |
| --- | --- | --- |
| PHP | `php/data/coral.db` | PDO + `schema.sql` |
| Node | `nodejs/data/coral.db` | `node:sqlite` (Node 22+) |
| Django | `django/data/coral.db` | модели + `migrate` + `seed` |

Запуск — [README](../../stage-09-database/README.md).

## Приёмка

`GET /api/products` отдаёт 8 товаров. После регистрации запись появляется в `users`. `POST /api/orders` пишет в `selected_products`.
