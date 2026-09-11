# Этап 5 — JavaScript

Карточки грузятся из `data/products.json`. Нужен локальный сервер — из этой папки:

```
python -m http.server 8080
```

Затем http://localhost:8080/

Если открыть файл напрямую, `fetch` не сработает и появится сообщение об ошибке.

Account открывает модалку входа. Select product без сессии просит войти. После входа выбранные товары пишутся в `localStorage` (`coral-selected`).
