# Инструкция. Этап 2 — CSS

## Зачем этап

Макет становится цветом, сеткой и типографикой. Пока **без БЭМ**: учим каскад и блочную модель, а не методологию имён.

## Папка

`stage-02-css/`

## Теория

- [Как работает CSS](https://developer.mozilla.org/ru/docs/Learn_web_development/Core/Styling_basics/What_is_CSS)
- [Каскад и наследование](https://developer.mozilla.org/ru/docs/Web/CSS/Cascade)
- [Специфичность](https://developer.mozilla.org/ru/docs/Web/CSS/Specificity)
- [Блочная модель](https://developer.mozilla.org/ru/docs/Learn_web_development/Core/Styling_basics/Box_model), [`box-sizing`](https://developer.mozilla.org/ru/docs/Web/CSS/box-sizing)
- [Flexbox](https://developer.mozilla.org/ru/docs/Learn_web_development/Core/CSS_layout/Flexbox)
- [Grid](https://developer.mozilla.org/ru/docs/Learn_web_development/Core/CSS_layout/Grids)
- [Кастомные свойства](https://developer.mozilla.org/ru/docs/Web/CSS/--*)
- [`:focus-visible`](https://developer.mozilla.org/ru/docs/Web/CSS/:focus-visible)
- [`object-fit`](https://developer.mozilla.org/ru/docs/Web/CSS/object-fit)

## Почему так

| Решение | Почему | Не берём |
| --- | --- | --- |
| `:root { --color-primary: … }` | Цвет из макета в одном месте | Десять раз `#9e5cf2` |
| `box-sizing: border-box` | width включает padding, проще сетка | Дефолтный content-box |
| Flex на шапку | Три зоны: поиск / лого / аккаунт | Абсолютное позиционирование логотипа сразу |
| Grid на каталог | N колонок + `gap` | Float (устаревший учебный путь) |
| Простые классы `.hero`, `.btn` | Мост к БЭМ, не путать с методологией | Bootstrap / Tailwind на этом курсе |
| Стили в файле, не inline | Каскад и повтор | `style=""` на каждой карточке |

## Пошагово

1. Подключите файл и шрифты в `<head>`. Вынесите токены:

```css
:root {
  --color-primary: #9e5cf2;
  --color-black: #1e2832;
  --container: 1320px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.container {
  width: min(var(--container), calc(100% - 40px));
  margin-inline: auto;
}
```

`min()` не даёт контейнеру вылезти за экран ([MDN: min()](https://developer.mozilla.org/ru/docs/Web/CSS/min)).

2. Шапка: `display: flex; justify-content: space-between; align-items: center`.
3. Герой: три колонки Grid (два фото + текст) **или** `display: contents` у обёртки галереи, чтобы дети встали в сетку родителя ([MDN: contents](https://developer.mozilla.org/ru/docs/Web/CSS/display#contents)).
4. Каталог:

```css
.product-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
```

5. Картинка карточки: фиксированная высота + `object-fit: cover`, иначе разные пропорции ломают ряды.
6. Кнопки: фон, padding, `:hover` и **обязательно** `:focus-visible`, чтобы Tab был виден.
7. Идите сверху вниз по макету. Не прыгайте в адаптив 375px — это этап 7.

## Пример: почему не float

Float вырывает элемент из потока, родителя нужно «очищать». Flex/Grid созданы для раскладки. Float оставляют для обтекания текстом картинки в статье.

## Проверка

Desktop рядом с макетом. Tab по ссылкам — кольцо фокуса. Карточки в ряд, не «лесенкой».

Тест: [../tests/02-css.md](../tests/02-css.md)
