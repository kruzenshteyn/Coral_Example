# Тестирование серверной части CORAL

Документ фиксирует **алгоритм уже проведённой проверки** и даёт **инструкцию**, как повторить её на PHP, Django и Node.js.

Контракт: [api-contract.md](api-contract.md).  
Готовые тела запросов: `data/register.json`, `data/login.json`, `data/order.json`.

Порты:

| Стек | Каталог | Адрес |
| --- | --- | --- |
| PHP | `php/` | http://localhost:8000 |
| Django | `django/` | http://127.0.0.1:8001 |
| Node.js | `nodejs/` | http://localhost:8002 |

Ниже в командах подставьте свой `BASE`, например `http://localhost:8002`.

На Windows в PowerShell используйте `curl.exe`, не алиас `curl`. JSON удобнее передавать файлом (`--data-binary "@..."`), а не строкой `-d "{...}"`: PowerShell ломает кавычки.

---

## 1. Алгоритм выполненного тестирования

Проверка шла сверху вниз: сначала «сервер жив и отдаёт каталог», потом сессия, потом заказ, потом статика, потом отказные сценарии. Тот же порядок нужно повторять на каждом стеке.

```
1. Запустить сервер
2. GET /api/products
      └─ ok: true, 8 товаров, пути картинок /assets/images/...
3. GET /api/me без cookie
      └─ 401, { ok: false, error: "Unauthorized" }
4. POST /api/auth/register (Ada / ada@example.com / secret1)
      └─ 200, { id, name, email }, пароля в JSON нет, Set-Cookie
5. GET /api/me с cookie
      └─ тот же пользователь
6. POST /api/orders { productId: "green-dress" }
      └─ { id, productId, createdAt }
7. GET /api/orders
      └─ массив с одним заказом green-dress
8. POST /api/auth/register тем же email
      └─ 409, "Email already registered"
9. POST /api/auth/login теми же данными
      └─ 200 и новая/та же сессия
10. GET /api/products/hoodie
      └─ карточка Yellow Reserved Hoodie
11. GET /
      └─ 200, HTML витрины
12. GET /css/style.css
      └─ 200
13. GET /assets/images/logo-zara.png
      └─ 200
```

### Что реально прогнали в этой среде

| Шаг | Django :8001 | Node.js :8002 | PHP :8000 |
| --- | --- | --- | --- |
| Каталог `GET /api/products` | да, 8 товаров | да, 8 товаров | нет: `php` не найден в PATH |
| `GET /api/me` без сессии | 401 | 401 | — |
| Регистрация Ada | 200, без пароля | 200, без пароля | — |
| `GET /api/me` с cookie | 200 | 200 | — |
| Заказ `green-dress` | 200, заказ сохранён | 200, заказ сохранён | — |
| Список заказов | 1 элемент | 1 элемент | — |
| Повторный email | 409 | 409 | — |
| Логин Ada | 200 | — | — |
| `GET /api/products/hoodie` | 200 | — | — |
| Главная `/` | 200 | 200 | — |
| `/css/style.css` | 200 | — | — |
| `/assets/images/logo-zara.png` | 200 | 200 | — |

Дополнительно: первый POST с JSON в кавычках PowerShell ушёл на сервер битым телом. После перехода на файлы `data/*.json` регистрация и заказ прошли. Это ограничение оболочки, не API.

PHP-код (`php/router.php`, `php/api.php`, `php/store.php`) написан по тому же контракту. Прогон curl на `:8000` не выполнялся, пока в системе нет `php`.

---

## 2. Инструкция: запуск серверов

Рабочая папка проекта: `Coral_Example`. Дальше команды из `stage-06-server/`.

### Node.js (порт 8002)

```powershell
cd stage-06-server\nodejs
npm install
npm start
```

Ожидаемая строка в консоли: `CORAL Node.js http://localhost:8002`.

### Django (порт 8001)

```powershell
cd stage-06-server\django
python -m pip install -r requirements.txt
python manage.py runserver 8001
```

Ожидаемая строка: `Starting development server at http://127.0.0.1:8001/`.

### PHP (порт 8000)

Нужен PHP 8+: `php -v`. Если команды нет — поставьте PHP и добавьте его в PATH.

```powershell
cd stage-06-server\php
php -S localhost:8000 router.php
```

Одновременно можно держать все три сервера: фронт один и тот же, данные (пользователи и заказы) у каждого стека свои файлы `*/data/store.json`.

---

## 3. Инструкция: повтор API-тестов (curl)

Из корня `Coral_Example`. Замените `8002` на `8001` или `8000`.

Файл cookie лучше класть во временную папку, не в репозиторий.

```powershell
$BASE = "http://localhost:8002"
$JAR  = "$env:TEMP\coral-cookies.txt"
$DATA = "d:\WORK\Web\Coral_Example\stage-06-server\data"
if (Test-Path $JAR) { Remove-Item $JAR }
```

**Шаг 2.** Каталог:

```powershell
curl.exe -sS "$BASE/api/products"
```

Ожидание: `"ok": true` и массив из 8 объектов. В каждом `image` начинается с `/assets/images/`. Поля `password` нет.

**Шаг 3.** Гость не видит профиль:

```powershell
curl.exe -sS -o NUL -w "%{http_code}" "$BASE/api/me"
```

Ожидание: `401`.

**Шаг 4.** Регистрация:

```powershell
curl.exe -sS -c $JAR -H "Content-Type: application/json" --data-binary "@$DATA\register.json" "$BASE/api/auth/register"
```

Ожидание: `"name": "Ada"`, `"email": "ada@example.com"`, поля `password` / `password_hash` нет. В `$JAR` появляется cookie сессии.

**Шаг 5.** Кто я:

```powershell
curl.exe -sS -b $JAR "$BASE/api/me"
```

**Шаг 6–7.** Заказ и список заказов:

```powershell
curl.exe -sS -b $JAR -c $JAR -H "Content-Type: application/json" --data-binary "@$DATA\order.json" "$BASE/api/orders"
curl.exe -sS -b $JAR "$BASE/api/orders"
```

Ожидание: `productId` равен `green-dress`. Повтор того же POST не создаёт второй заказ (идемпотентность).

**Шаг 8.** Занятый email:

```powershell
curl.exe -sS -H "Content-Type: application/json" --data-binary "@$DATA\register.json" "$BASE/api/auth/register"
```

Ожидание: `"Email already registered"`.

**Шаг 9.** Вход:

```powershell
curl.exe -sS -c $JAR -H "Content-Type: application/json" --data-binary "@$DATA\login.json" "$BASE/api/auth/login"
```

**Шаг 10.** Одна карточка:

```powershell
curl.exe -sS "$BASE/api/products/hoodie"
```

**Шаги 11–13.** Статика:

```powershell
curl.exe -sS -o NUL -w "%{http_code}" "$BASE/"
curl.exe -sS -o NUL -w "%{http_code}" "$BASE/css/style.css"
curl.exe -sS -o NUL -w "%{http_code}" "$BASE/assets/images/logo-zara.png"
```

Ожидание: трижды `200`.

Критерий «стек сдан»: все шаги 2–13 совпадают с колонкой «ожидание». Три стека сравнивают **одинаковыми** запросами, меняется только порт.

---

## 4. Инструкция: проверка в браузере

1. Откройте `http://localhost:8002/` (или 8001 / 8000).
2. В блоках Products и Best sellers должны появиться карточки, не текст «Could not load /api/products».
3. Account → Create account: имя, email, пароль ≥ 6 символов, повтор пароля.
4. После входа в шапке имя/email, видна кнопка Log out.
5. Карточка товара → **Select product**.
6. Обновите страницу: рамка выбранной карточки и бейдж корзины на месте (заказ на сервере, не в `localStorage`).
7. Log out → Select product снова открывает модалку входа.
8. Невалидный email на форме не уходит на сервер.

Без локального сервера (`file://`) `fetch` к `/api/...` не работает — это ожидаемо.

---

## 5. Если тест не проходит

| Симптом | Что проверить |
| --- | --- |
| `php` не находится | PHP не в PATH; для сдачи используйте Django/Node или установите PHP 8 |
| `Could not load /api/products` | Открыта не та папка / не тот порт, сервер не запущен |
| Регистрация `Invalid registration data` при живом JSON | Тело запроса обрезано оболочкой; используйте `--data-binary "@файл"` |
| `401` сразу после register | Cookie не сохранились: нет `-c`/`-b` или другой хост (`localhost` vs `127.0.0.1`) |
| Картинки 404 | Сервер должен отдавать `/assets` из корневой `assets/` репозитория |
| Django ругается на migrate sessions | Для учебного режима сессия в signed cookie, миграции не нужны |
| Повторная регистрация Ada | Нормально: 409. Смените email или удалите `django/data/store.json` / `nodejs/data/store.json` / `php/data/store.json` |
