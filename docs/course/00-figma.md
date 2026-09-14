# Этап 0. Разбор Coral.fig

Общие правила макета (сетка, токены, состояния) — во [вводной лекции](lectures/00-figma/lecture.md), живые примеры: [lectures/00-figma/examples.html](lectures/00-figma/examples.html). Ниже — карта именно `Coral.fig`.

## Что в файле

Одна основная страница **Design**, ширина 1920px, длинный лендинг интернет-магазина. Отдельных фреймов Login нет.

## Блоки главной сверху вниз

| # | Слой / смысл | HTML на этапе 1 |
| --- | --- | --- |
| 1 | `top-header`: поиск, логотип CORAL, Account, корзина | `header` |
| 2 | `menu`: 7 пунктов каталога | `nav` |
| 3 | `top-main`: два фото + заголовок Collections + Shop now | `section.hero` |
| 4 | `brand`: ряд логотипов | `section` с списком |
| 5 | `hot-category`: Explore new and popular styles | сетка категорий |
| 6 | `grid-products`: карточки `card-product` | список товаров |
| 7 | `brand-banner`: Zara, 70% / evening wear, See collection | промо-баннер |
| 8 | `slider-products`: Best sellers + табы | вторая витрина |
| 9 | Instagram: Follow products and discounts | галерея |
| 10 | `newsletter`: Or subscribe to the newsletter | форма email |
| 11 | `footer`: 3 колонки ссылок, соцсети, © 2022 Coral, Inc. | `footer` |

## Каталог меню (как в макете)

Jewelry & Accessories · Clothing & Shoes · Home & Living · Wedding & Party · Toys & Entertainment · Art & Collectibles · Craft Supplies & Tools

## Категории

Manto — 86 product · Pants — 200 · Coat — 520 · Shirt — 320

## Товары (имена из макета)

- Adicolor Classics Joggers
- Nike Sportswear Futura Luxe
- Geometric print Scarf
- Yellow Reserved Hoodie
- Basic Dress Green
- Nike Air Zoom Pegasus
- Nike Repel Miler
- Glasses

Цены, которые удалось снять из файла: `$63.85`, `$130.00`, `$53.00`, `$364.00` / `$155.00` (скидка), `$236.00`, `$198.00`, `$120.50`, `$160.00`.

## Учебные модалки (их нет на холсте)

| Модалка | Зачем в курсе |
| --- | --- |
| Вход / регистрация | клик по Account |
| Карточка товара | клик по `card-product` или «выбрать» |

Оформляем тем же Primary `#9E5CF2`, Roboto / Open Sans, кнопками `shop now`.

## ДЗ этапа 0

Подписать 5 блоков макета: HTML-тег, зачем он пользователю, какие элементы внутри.
