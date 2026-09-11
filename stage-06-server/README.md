# Этап 6 — сервер

Общий фронт: `frontend/`. Общий контракт: `api-contract.md`.  
Алгоритм проверки и инструкция: [TESTING.md](TESTING.md).

Картинки отдаются с `/assets/...` из корневой папки `assets/`.

## PHP (порт 8000)

Нужен PHP 8+ в PATH (`php -v`). Если команды нет — поставьте PHP или пользуйтесь Django/Node.

```
cd php
php -S localhost:8000 router.php
```

## Django (порт 8001)

```
cd django
python -m pip install -r requirements.txt
python manage.py runserver 8001
```

## Node.js (порт 8002)

```
cd nodejs
npm install
npm start
```

Откройте в браузере соответствующий localhost. Зарегистрируйтесь, откройте карточку, Select product — заказ уходит на сервер и переживает перезагрузку страницы.
