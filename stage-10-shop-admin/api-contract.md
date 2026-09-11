# API-контракт CORAL

Один JSON для PHP, Django и Node.js. Сессия — cookie, `fetch` с `credentials: "include"`.

Ответ:

```json
{ "ok": true, "data": {} }
{ "ok": false, "error": "Email already registered" }
```

Пароль в ответах не отдаём.

| Метод | Путь | Кто | Назначение |
| --- | --- | --- | --- |
| GET | `/api/products` | все | список товаров |
| GET | `/api/products/:id` | все | один товар |
| POST | `/api/auth/register` | гость | `{ "name", "email", "password" }` |
| POST | `/api/auth/login` | гость | `{ "email", "password" }` |
| POST | `/api/auth/logout` | сессия | выход |
| GET | `/api/me` | сессия | текущий пользователь |
| GET | `/api/orders` | сессия | выбранные товары |
| POST | `/api/orders` | сессия | `{ "productId" }` |

Коды: `400` валидация, `401` нет сессии / неверный пароль, `404` нет товара, `409` email занят.

Пользователь в `data`: `{ "id", "name", "email" }`.  
Заказ: `{ "id", "productId", "createdAt" }`.
