# Этап 9 — база данных SQLite

JSON-хранилище заменено на SQLite. HTTP-контракт тот же, что на этапе 6: [api-contract.md](api-contract.md).

Схема: `data/schema.sql`. Файл БД у каждого стека свой: `php/data/coral.db`, `django/data/coral.db`, `nodejs/data/coral.db`.

Сиды: товары из `data/products.json`, админ `admin@coral.local` / `admin123` (нужен на этапе 10).

## Запуск

PHP:

```
cd php
php -S localhost:8000 router.php
```

Django:

```
cd django
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```

Node.js (встроенный `node:sqlite`, Node 22+):

```
cd nodejs
npm install
npm start
```

Откройте витрину и проверьте `GET /api/products` — данные уже из таблиц, не из JSON в рантайме.
