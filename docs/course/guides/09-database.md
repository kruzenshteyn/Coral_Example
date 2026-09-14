# Инструкция. Этап 9 — база данных

## Зачем этап

JSON-файл нельзя нормально спрашивать «все заказы пользователя X» под нагрузкой и без гонок записи. Появляется таблица, ключ, INSERT/SELECT. HTTP-контракт этапа 6 **не меняем** — меняется только хранилище.

## Папка

`stage-09-database/`  
Схема: `data/schema.sql`

Вводная лекция (разбор теста с примерами): [../lectures/09-database/lecture.md](../lectures/09-database/lecture.md), [живые примеры](../lectures/09-database/examples.html).

## Теория

- [SQLite: когда уместен](https://www.sqlite.org/whentouse.html)
- [SQL CREATE TABLE](https://www.sqlitetutorial.net/sqlite-create-table/) (практика SQLite)
- [Ключи: PRIMARY](https://developer.mozilla.org/en-US/docs/Glossary/Primary_key) (глоссарий), внешние ключи — идея связи таблиц
- [SQL injection](https://developer.mozilla.org/ru/docs/Learn_web_development/Extensions/Server-side/First_steps/Website_security#sql-inekciya) — поэтому плейсхолдеры `?` / ORM
- PHP: [PDO](https://www.php.net/manual/ru/book.pdo.php), [подготовленные запросы](https://www.php.net/manual/ru/pdo.prepared-statements.php)
- Node: [`node:sqlite`](https://nodejs.org/api/sqlite.html) (22+)
- Django: [модели](https://docs.djangoproject.com/en/stable/topics/db/models/), [миграции](https://docs.djangoproject.com/en/stable/topics/migrations/)

MDN мало пишет «как поставить SQLite», поэтому схема и SQL — sqlite.org + документация стека.

## Почему так

| Решение | Почему | Не берём |
| --- | --- | --- |
| SQLite файл рядом с проектом | Ноль демонов, видно `coral.db` | PostgreSQL в Docker в первый день БД |
| Одна `schema.sql` для PHP и Node | Три стека, одна модель данных | У каждого свои имена столбцов |
| Django ORM + `db_table = "products"` | Студент видит и SQL, и модели | Сырой SQL в Django «как в PHP» без темы ORM |
| Сид из `products.json` при пустой таблице | Старый файл не выбрасываем | Ручной INSERT восьми товаров на занятии |
| Пароль только `password_hash` | Как на этапе 6 | Хранить пароль открытым «для отладки» |
| Админ `admin@coral.local` уже здесь | Этап 10 не начинает с пустых users | Выдумывать админа позже |

JSON после сида **не** источник истины. Чтобы сбросить витрину — удалите `coral.db` и перезапустите (или `manage.py seed` после очистки).

## Пошагово

1. Прочитайте `schema.sql`: три таблицы, UNIQUE на email, связь user ↔ selected_products.
2. PHP:

```powershell
cd stage-09-database\php
php -S localhost:8000 router.php
```

При первом запросе создастся `php/data/coral.db`.

3. Node 22+:

```powershell
cd stage-09-database\nodejs
npm install
npm start
```

4. Django:

```powershell
cd stage-09-database\django
python manage.py migrate
python manage.py seed
python manage.py runserver 8001
```

5. Проверка: `GET /api/products` — 8 товаров. Зарегистрируйтесь, сделайте Select, откройте БД (DB Browser for SQLite или `python manage.py dbshell`) — строки в `users` и `selected_products`.
6. Измените title в JSON, обновите страницу: витрина **не** меняется. Это доказательство, что читаете таблицу.

## Пример: плейсхолдер, не склейка

```php
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
```

Нельзя: `"... WHERE email = '$email'"`. Иначе [инъекция](https://developer.mozilla.org/ru/docs/Learn_web_development/Extensions/Server-side/First_steps/Website_security#sql-inekciya).

## Проверка

Файл `.db` есть. API как на этапе 6. Пароля в JSON нет.

Тест: [../tests/09-database.md](../tests/09-database.md)
