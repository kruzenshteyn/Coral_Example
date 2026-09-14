# Инструкция. Этап 7 — адаптив и CSS по папкам

## Зачем этап

Макет — desktop. Телефон не прощает ширину 1320px. Плюс монолитный CSS неудобно искать: медиазапросы «в конце файла» отрываются от блока.

## Папка

`stage-07-adaptive/`

Вводная лекция (разбор теста с примерами): [../lectures/07-adaptive/lecture.md](../lectures/07-adaptive/lecture.md), [живые примеры](../lectures/07-adaptive/examples.html).

## Теория

- [Адаптивный дизайн](https://developer.mozilla.org/ru/docs/Learn_web_development/Core/CSS_layout/Responsive_Design)
- [Мета viewport](https://developer.mozilla.org/ru/docs/Web/HTML/Viewport_meta_tag)
- [@media](https://developer.mozilla.org/ru/docs/Web/CSS/@media), [Using media queries](https://developer.mozilla.org/ru/docs/Web/CSS/CSS_media_queries/Using_media_queries)
- [Mobile first vs другое](https://developer.mozilla.org/ru/docs/Learn_web_development/Core/CSS_layout/Responsive_Design#mobile_first) — мы сознательно desktop-first
- [`min()`](https://developer.mozilla.org/ru/docs/Web/CSS/min), [`clamp()`](https://developer.mozilla.org/ru/docs/Web/CSS/clamp)
- [@import](https://developer.mozilla.org/ru/docs/Web/CSS/@import) — учебная склейка без сборщика
- [object-fit](https://developer.mozilla.org/ru/docs/Web/CSS/object-fit) на узких экранах

## Почему так

| Решение | Почему | Не берём |
| --- | --- | --- |
| Desktop-first (`max-width`) | Макет Figma — 1920, нет отдельного mobile-фрейма | Притворяться, что макет mobile-first |
| `@media` внутри файла блока | Меняешь герой — адаптив героя рядом | Один огромный `@media` внизу `style.css` |
| Папка `css/blocks/hero/hero.css` | Как БЭМ: один блок — один файл | Сборщик Vite «чтобы было как в проде» на этом этапе |
| Бургер с 768px | Горизонтальное меню из 7 пунктов не влезает | Всегда показывать 7 ссылок 10px |
| Hover-кнопка на карточке на таче всегда видна | Hover на пальце нет | Действие только по `:hover` |

`@import` блокирует отрисовку (много запросов). В проде файлы склеивают. Здесь важнее читаемая структура. См. примечание MDN об @import.

## Пошагово

1. HTML подключает **один** файл:

```html
<link rel="stylesheet" href="css/index.css" />
```

2. `css/index.css` только импортирует:

```css
@import url("common/variables.css");
@import url("blocks/hero/hero.css");
/* … */
```

3. В `hero.css` база (3 колонки) и упрощение:

```css
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr 0.9fr;
}

@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
```

4. Карточки: 4 → 3 (1100) → 2 (768) → 1 (480) колонка через `grid-template-columns`.
5. DevTools: 1280, 1024, 768, 375. Проверьте бургер, модалку, отсутствие горизонтального скролла (`document.documentElement.scrollWidth` не больше `innerWidth`).

## Пример: почему 768, а не «магическое 767»

Порог условный. Важно **поведение**: меню прячется, сетка меняется. Зафиксируйте три числа на курс и не плодите 12 брейкпоинтов «под каждый телефон».

## Проверка

375px без горизонтального скролла. Бургер открывает меню. Карточка открывается.

Тест: [../tests/07-adaptive.md](../tests/07-adaptive.md)
