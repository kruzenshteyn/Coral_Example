# Инструкция. Этап 6 — сервер

## Зачем этап

Браузер умеет только свой origin и не хранит пароли надёжно. Появляется HTTP: метод, путь, статус, JSON, cookie-сессия. Три языка — один контракт, чтобы увидеть: протокол важнее синтаксиса.

## Папка

`stage-06-server/`  
Контракт: [api-contract.md](../../stage-06-server/api-contract.md)  
Прогон curl: [TESTING.md](../../stage-06-server/TESTING.md)

Вводная лекция (разбор теста с примерами): [../lectures/06-server/lecture.md](../lectures/06-server/lecture.md), [живые примеры](../lectures/06-server/examples.html).

## Теория

- [Обзор HTTP](https://developer.mozilla.org/ru/docs/Web/HTTP/Guides/Overview)
- [Методы](https://developer.mozilla.org/ru/docs/Web/HTTP/Reference/Methods): [GET](https://developer.mozilla.org/ru/docs/Web/HTTP/Reference/Methods/GET), [POST](https://developer.mozilla.org/ru/docs/Web/HTTP/Reference/Methods/POST)
- [Коды ответа](https://developer.mozilla.org/ru/docs/Web/HTTP/Reference/Status): [401](https://developer.mozilla.org/ru/docs/Web/HTTP/Reference/Status/401), [403](https://developer.mozilla.org/ru/docs/Web/HTTP/Reference/Status/403), [404](https://developer.mozilla.org/ru/docs/Web/HTTP/Reference/Status/404), [409](https://developer.mozilla.org/ru/docs/Web/HTTP/Reference/Status/409)
- [Cookie](https://developer.mozilla.org/ru/docs/Web/HTTP/Guides/Cookies), [`HttpOnly`](https://developer.mozilla.org/ru/docs/Web/HTTP/Reference/Headers/Set-Cookie#httponly)
- [CORS](https://developer.mozilla.org/ru/docs/Web/HTTP/Guides/CORS) — зачем один origin (статика + API с одного хоста)
- [Same-origin](https://developer.mozilla.org/ru/docs/Web/Security/Same-origin_policy)
- PHP: [встроенный сервер](https://www.php.net/manual/ru/features.commandline.webserver.php), [сессии](https://www.php.net/manual/ru/book.session.php), [`password_hash`](https://www.php.net/manual/ru/function.password-hash.php)
- Django: [запрос/ответ](https://docs.djangoproject.com/en/stable/ref/request-response/), [сессии](https://docs.djangoproject.com/en/stable/topics/http/sessions/)
- Node: [Express routing](https://expressjs.com/en/guide/routing.html), [express-session](https://www.npmjs.com/package/express-session)

## Почему так

| Решение | Почему | Не берём |
| --- | --- | --- |
| Один JSON `{ ok, data }` / `{ ok, error }` | Фронт один, бэкенды три | У каждого стека свой формат |
| Сессия в cookie, не JWT в localStorage | Учебный HTTP; cookie уходит сама, HttpOnly недоступен XSS-скрипту так же легко | «Токен в localStorage» без понимания XSS |
| Статика с того же сервера | Нет CORS на занятии | Live Server :5500 + API :8000 |
| PHP без фреймворка | Виден `REQUEST_URI` и заголовки | Laravel на первом серверном дне |
| Django без DRF | `JsonResponse` достаточно | Лишний слой сериализаторов |
| Express, не голый `http` | Компромисс: маршруты читаемые | Чтение stream вручную |
| CSRF middleware на учебном JSON выключен | Иначе фронт тащит токен раньше темы CSRF | Игнор темы: в [тестах](../tests/06-server.md) CSRF всё равно спрашивают |

## Пошагово

1. Прочитайте таблицу путей в контракте. Нарисуйте на бумаге: кто гость, кто с cookie.
2. Поднимите **один** стек:

```powershell
cd stage-06-server\php
php -S localhost:8000 router.php
```

```powershell
cd stage-06-server\django
python manage.py runserver 8001
```

```powershell
cd stage-06-server\nodejs
npm install
npm start
```

3. Каталог (подставьте порт):

```powershell
curl.exe -sS http://localhost:8000/api/products
```

Ожидание: `"ok": true` и массив. Поля `password` нет.

4. Регистрация **файлом** (PowerShell ломает JSON в `-d "{...}"`):

```powershell
curl.exe -sS -c %TEMP%\c.txt -H "Content-Type: application/json" --data-binary "@stage-06-server\data\register.json" http://localhost:8000/api/auth/register
```

5. `GET /api/me` с `-b` cookie — 200; без cookie — 401.
6. Браузер: тот же origin, регистрация, Select product, F5.
7. Второй стек: только `GET /api/products` тем же URL-путём — тела совпадают по смыслу.

## Пример ответа

```json
{ "ok": true, "data": { "id": 1, "name": "Ada", "email": "ada@example.com" } }
{ "ok": false, "error": "Email already registered" }
```

Фронт смотрит `ok`, а не только HTTP-код. Код всё равно ставьте правильный (409 на занятый email): так делают мониторинг и curl.

## Проверка

Сценарий из TESTING.md. Пароль нигде в JSON. `/` и картинка `/assets/...` отдают 200.

Тест: [../tests/06-server.md](../tests/06-server.md)
