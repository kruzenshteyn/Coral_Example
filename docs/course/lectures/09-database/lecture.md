# Вводная лекция. Базы данных и SQL

Этап 9 курса. Тема теста: [Базы данных и SQL](../../tests/09-database.md) — общие правила таблиц и SQL, **не** про CSS Grid и не про имена классов Coral.

Живые примеры к этой лекции: [examples.html](examples.html) (открыть в браузере).

Эталон этапа: `stage-09-database/`.  
Как поднять стек руками: [../../guides/09-database.md](../../guides/09-database.md).

HTTP-контракт тот же, что на этапе 6. Меняется хранилище: вместо `store.json` — SQLite `coral.db`.

---

## Зачем эта лекция

JSON-файл нельзя нормально спросить «все выбранные товары пользователя 3» под нагрузкой и без гонок записи. Появляется таблица, ключ, `INSERT` / `SELECT`.

Три стека смотрят в одну схему `data/schema.sql`:

| Стек | Файл БД | Как пишем SQL |
| --- | --- | --- |
| PHP | `php/data/coral.db` | PDO + `schema.sql` |
| Node | `nodejs/data/coral.db` | `node:sqlite` (Node 22+) |
| Django | `django/data/coral.db` | модели + `migrate` + `seed` |

На тесте правильный ответ почти всегда про **смысл конструкции SQL**, а не про папку диска, HTTP-заголовок или CSS.

---

## 1. Модель: таблица, строка, ключи, NULL

Таблица — **набор строк с одинаковыми столбцами**. Не CSS Grid, не HTTP-заголовок, не «просто папка».

Строка (row / tuple) — **одна запись**. Не имя столбца, не индекс файла, не транзакция.

В Coral три таблицы этапа 9:

```text
users                products              selected_products
─────────────        ──────────────        ─────────────────
id PK                id PK (TEXT)          id PK
name                 title                 user_id  FK → users.id
email UNIQUE         category              product_id FK → products.id
password_hash        price                 created_at
is_admin             …
```

### PRIMARY KEY

**Уникально идентифицирует строку.** Не «всегда текст», не дублируется свободно, не CSS `id`.

У `users` ключ — целое `id`. У `products` ключ — текстовый слаг `"joggers"`, `"nike-bag"`: так же, как в JSON этапа 5.

### FOREIGN KEY

**Ссылка на ключ другой таблицы.** Не замена PRIMARY KEY, не HTTP cookie, индекс при этом не запрещён.

`selected_products.user_id` указывает на `users.id`. Нельзя «выбрать товар» от пользователя, которого нет. В SQLite внешние ключи ещё включают: `PRAGMA foreign_keys = ON`.

### UNIQUE на email

**Не даст две одинаковые почты.** Не шифрует email, не делает PRIMARY KEY «автоматически всегда», не удаляет NULL.

Регистрация второго `admin@coral.local` должна получить конфликт (на API — 409), а не второго админа.

### NULL

**Нет значения.** Это не число 0, не пустая строка `''` и не `false`.

У Hoodie есть `old_price = 364`, у Joggers `old_price` — NULL: скидки нет. `price = 0` значило бы «товар бесплатный», `badge = ''` — пустая строка, не «бейджа нет».

```sql
SELECT title, old_price FROM products WHERE old_price IS NULL;
-- Adicolor Classics Joggers
```

Сравнение `old_price = NULL` в SQL не находит строк — пишут `IS NULL`.

**На тесте:** таблица, row, PK, FK, UNIQUE, NULL.

---

## 2. SQL CRUD: читать, писать, фильтровать, считать

| Глагол | Смысл | Не путать |
| --- | --- | --- |
| `SELECT` | чтение строк | удаление таблицы, создание пользователя ОС, HTTP POST |
| `INSERT` | добавление строк | только чтение, смена схемы, COMMIT |
| `UPDATE` | изменение существующих строк | создание БД, DROP, GRANT |
| `DELETE` | удаление **строк** | удаление столбца — это `DROP` / `ALTER` |

```sql
SELECT id, title, price FROM products;

INSERT INTO users (name, email, password_hash, is_admin)
VALUES ('Ada', 'ada@coral.local', '…hash…', 0);

UPDATE products SET price = 59.90 WHERE id = 'joggers';

DELETE FROM selected_products WHERE user_id = 3 AND product_id = 'joggers';
```

`DELETE` не выкидывает столбец `price` из `products`. Схему меняют отдельно.

### WHERE

**Фильтр строк.** Не сортировка, не имя БД, не тип JOIN.

```sql
SELECT * FROM products WHERE category = 'Bag';
-- Nike Sportswear Futura Luxe, $130
```

Без WHERE `UPDATE`/`DELETE` заденут все строки — учебная катастрофа.

### JOIN

Нужен, чтобы **связать строки таблиц по условию**. Не склеить CSS, не сжать PNG, не открыть порт.

Выбранные товары без JOIN — одни id. С JOIN — имена с витрины:

```sql
SELECT u.email, p.title, s.created_at
FROM selected_products AS s
JOIN users AS u ON u.id = s.user_id
JOIN products AS p ON p.id = s.product_id
WHERE u.email = 'ada@coral.local';
```

Так `GET /api/orders` собирает список «что выбрала сессия», не два отдельных JSON.

### ORDER BY

**Сортировка результата.** Не фильтр, индекс не создаёт «всегда», не транзакция.

```sql
SELECT title, price FROM products ORDER BY price;
```

### COUNT(*)

**Число строк** в группе или выборке. Не сумма, не среднее, не максимум.

```sql
SELECT COUNT(*) FROM products;                 -- 8 карточек витрины
SELECT COUNT(*) FROM users WHERE is_admin = 1; -- 1 админ после сида
```

Сумма — `SUM(price)`, среднее — `AVG`. На тесте ловушка именно в этом.

**На тесте:** SELECT, INSERT, UPDATE, DELETE, WHERE, JOIN, ORDER BY, COUNT(*).

---

## 3. Транзакции и SQLite

Транзакция — **набор операций, все или ничего**. Не один SELECT, не «WAL запрещён», не HTTP/2.

`COMMIT` **фиксирует** транзакцию. `ROLLBACK` **отменяет незафиксированную**. Не то же самое, не VACUUM, не SELECT.

Сценарий «выбрать товар» из двух шагов без транзакции: записали связь, упали до ответа клиенту — или наоборот. На этапе 10 checkout без транзакции ещё опаснее: заказ есть, корзина не очищена (или корзина пуста, заказа нет).

```sql
BEGIN;
INSERT INTO selected_products (user_id, product_id, created_at)
VALUES (3, 'joggers', '2026-09-14T10:00:00Z');
COMMIT;     -- теперь видно всем

BEGIN;
DELETE FROM users WHERE id = 3;
ROLLBACK;   -- пользователь на месте
```

### SQLite — один файл

Данные **обычно в одном файле** (`coral.db`). Не «только AWS обязательно», не «только RAM без файла никогда», не CSS.

Поэтому учебный стек без Docker: файл рядом с PHP/Node/Django. Сбросить витрину — удалить `coral.db` и перезапустить (сид создаст снова).

### Типы

| Тип | Смысл | Не |
| --- | --- | --- |
| `INTEGER` | целые (и совместимость с rowid) | «только boolean в отдельном движке всегда», только даты, BLOB-текст |
| `TEXT` | строки | только числа, отдельный JSON-тип обязателен, картинки как файлы ОС |
| `REAL` | числа с плавающей точкой | банковские деньги с точностью банка **всегда**, дата, boolean |

`users.id INTEGER`, `email TEXT`, `products.price REAL`. Деньги в банке считают decimal/integer-центами; `REAL` для учебного `$63.85` годится, но 0.1 + 0.2 в float — известная ловушка. На тесте правильный ответ: float, не «всегда банк».

Картинка товара — `TEXT` с путём `/assets/images/…`, не BLOB файла в таблице.

### AUTOINCREMENT

**Новые id выдаёт база.** UUID в приложении не обязателен, в SQLite автоинкремент не запрещён, это не FOREIGN KEY.

После `INSERT INTO users …` PHP берёт `lastInsertId()`, Node — то же. Клиент не присылает id пользователя.

### Бэкап

Часто это **копия файла БД при остановленных записи** или **online backup API**. Не git push HTML, не невозможно, не DROP TABLE.

Скопировать `coral.db`, пока идёт запись, можно словить «рваный» файл. Для занятия достаточно остановить сервер и скопировать.

**На тесте:** транзакция, COMMIT, ROLLBACK, один файл, INTEGER/TEXT/REAL, AUTOINCREMENT, бэкап.

---

## 4. Проектирование и безопасность

### 3NF упрощённо

**Убрать избыточность, факты в одном месте.** Не одну широкую таблицу на всё, не запрет ключей, не «только JSON».

Плохо: в каждой строке «выбора» копировать email и цену витрины как единственный источник. Email живёт в `users`, цена карточки — в `products`. Выбор — только связь `user_id` + `product_id`.

(На этапе 10 цена **заказа** копируется специально: это снимок покупки, а не текущая витрина. Нормализация и снимок — разные задачи.)

### Индекс

Ускоряет **поиск по столбцу ценой места и более медленной записи**. Не ускоряет INSERT «всегда», не только DROP, не HTTP.

`UNIQUE (email)` уже даёт индекс: логин `WHERE email = ?` быстрый, зато каждый `INSERT` проверяет уникальность.

### SQL-инъекция

**Подстановка вредоносного SQL через ввод.** Не вид JOIN, не нормальный seed, не UTF-8.

```php
// опасно: склейка
$sql = "SELECT * FROM users WHERE email = '" . $email . "'";
// email = ' OR 1=1 --   → вошли «всеми»
```

Защита — **параметризованные запросы / плейсхолдеры**, не склеивать строки SQL с вводом. Не «отключить WHERE», не «только HTTPS».

```php
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
```

Ввод остаётся данными, не становится командой. HTTPS шифрует канал, но не лечит склейку.

### ORM

**Объекты кода ↔ таблицы.** Не только CSV, не веб-сервер, не CSS-методология.

Django: класс `Product` ↔ таблица `products` (`db_table = "products"`). PHP на этапе пишет SQL руками через PDO — это не ORM, и это нормально для сравнения.

### Миграция схемы

**Версионированное изменение таблиц.** Не копирование JPG, не смена домена, не minify JS.

Django: `migrate` добавляет столбцы по файлам миграций. PHP/Node на курсе применяют `schema.sql` целиком к новому файлу — учебное упрощение той же идеи «схема живёт в git».

### Сид (seed)

**Начальные данные.** Не удаление БД, не индекс, не WAL.

Coral: восемь карточек из `data/products.json` + пользователь `admin@coral.local` / `admin123` (`is_admin = 1`). JSON после сида **не** источник истины: витрина читается из таблиц.

**На тесте:** 3NF, индекс, инъекция, плейсхолдеры, ORM, миграция, seed.

---

## Как отвечать на тесте

1. Отбросьте CSS Grid, HTTP-заголовок, PNG, DNS — ловушки с других этапов.
2. Ищите **роль в данных**: строка vs столбец, ключ vs ссылка, чтение vs изменение схемы.
3. Если вопрос про глагол SQL (`SELECT`, `DELETE`, `COMMIT`) — что он делает с **строками**, не с файлами ОС.

После лекции: откройте `stage-09-database/data/schema.sql` ([ДЗ этапа 9](../../09-database.md)), поднимите один стек, проверьте `GET /api/products` из `coral.db`, затем тест.
