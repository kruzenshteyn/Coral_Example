# Coral — учебный интернет-магазин

Курс для студентов: верстаем и оживляем сайт по макету `Coral.fig` (fashion e-commerce), затем подключаем сервер в трёх вариантах.

## Как устроен курс

| Этап | Папка | Что сдаём |
| --- | --- | --- |
| 0. Макет | `design/`, `docs/course/` | карта блоков, токены |
| 1. HTML | `stage-01-html/` | семантическая главная без CSS |
| 2. CSS | `stage-02-css/` | визуал по Figma |
| 3. БЭМ | `stage-03-bem/` | рефакторинг классов |
| 4. Модалки | `stage-04-modals/` | вход и карточка товара |
| 5. JS | `stage-05-js/` | поведение, валидация, выбор товара |
| 6. Сервер | `stage-06-server/` | PHP, Django, Node.js — один API |
| 7. Адаптив | `stage-07-adaptive/` | CSS по папкам блоков, брейкпоинты 1100 / 768 / 480 |
| 8. ООП | `stage-08-oop/` | JS на классах и ES-модулях |
| 9. БД | `stage-09-database/` | SQLite, тот же API |
| 10. Магазин | `stage-10-shop-admin/` | корзина, заказы, админка карточек |

**Начни отсюда (новичок):** [docs/course/kak-sdelat-sajt.md](docs/course/kak-sdelat-sajt.md)

Подробная программа: [docs/course/README.md](docs/course/README.md).  
Рабочие программы (09.03.02 Web-разработка; 27.03.04 ИСУ) и ФОС: [docs/course/rpd/README.md](docs/course/rpd/README.md).  
Инструкции по этапам: [docs/course/guides/README.md](docs/course/guides/README.md).  
Тесты (30 вопросов на раздел): [docs/course/tests/README.md](docs/course/tests/README.md).

## Макет

https://www.figma.com/design/bfB9Voiv6vjbKwcDaTakqi/Coral?node-id=505-790&t=Q3X5fsc7AgHsYJNA-1

Файл `Coral.fig` — магазин одежды и аксессуаров **CORAL**, не туристический сайт.

- Главная: шапка, коллекции, категории, сетка товаров, баннер Zara, best sellers, Instagram, рассылка, подвал.
- Модалки авторизации в макете нет — делаем по дизайн-системе (этап 4).
- Карточка товара: компонент `card-product` + учебная модалка выбора.

## Быстрый просмотр

| Что смотреть | Файл |
| --- | --- |
| HTML без стилей | `stage-01-html/index.html` |
| Вёрстка по макету | `stage-02-css/index.html` |
| БЭМ | `stage-03-bem/index.html` |
| Модалки (`#modal-auth`) | `stage-04-modals/index.html` |
| Рабочий фронт | `stage-05-js/index.html` |
| Сервер | `stage-06-server/` — PHP :8000, Django :8001, Node :8002 |
| Адаптив | `stage-07-adaptive/index.html` |
| ООП | `stage-08-oop/index.html` |
| БД | `stage-09-database/` |
| Корзина и админка | `stage-10-shop-admin/frontend/` |

## Стек к концу курса

HTML, CSS, БЭМ, ванильный JavaScript. Бэкенд на выбор группы: PHP / Django / Node.js, общий контракт в `stage-06-server/api-contract.md`.
