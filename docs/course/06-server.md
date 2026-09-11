# Этап 6. Сервер

Папка: `stage-06-server/`.

Один фронт (`frontend/`) и три бэкенда с одним контрактом: [api-contract.md](../../stage-06-server/api-contract.md).

| Стек | Запуск | Порт |
| --- | --- | --- |
| PHP | `php -S localhost:8000 router.php` из `php/` | 8000 |
| Django | `python manage.py runserver 8001` из `django/` | 8001 |
| Node.js | `npm install` затем `npm start` из `nodejs/` | 8002 |

Проверка: [TESTING.md](../../stage-06-server/TESTING.md) (алгоритм прогона и инструкция). Краткие curl-команды: [api-tests.md](api-tests.md).

На занятии: сначала контракт и Postman/curl, потом PHP (самый прямой HTTP), Django, Node.
