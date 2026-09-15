# Инструкция. Этап 1 — HTML

## Зачем этап

CSS прячет плохую структуру. Страница должна читаться **без стилей**: заголовки, списки, формы, картинки с текстом вместо файла.

## Папка

`stage-01-html/`

Вводная лекция (разбор теста с примерами): [../lectures/01-html/lecture.md](../lectures/01-html/lecture.md), [живые примеры](../lectures/01-html/examples.html).

## Теория

- [DOCTYPE](https://developer.mozilla.org/ru/docs/Glossary/Doctype)
- [Структура HTML-документа](https://developer.mozilla.org/ru/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax)
- [Семантические элементы](https://developer.mozilla.org/ru/docs/Glossary/Semantics#semantika_v_html): [`header`](https://developer.mozilla.org/ru/docs/Web/HTML/Element/header), [`nav`](https://developer.mozilla.org/ru/docs/Web/HTML/Element/nav), [`main`](https://developer.mozilla.org/ru/docs/Web/HTML/Element/main), [`article`](https://developer.mozilla.org/ru/docs/Web/HTML/Element/article), [`section`](https://developer.mozilla.org/ru/docs/Web/HTML/Element/section), [`footer`](https://developer.mozilla.org/ru/docs/Web/HTML/Element/footer)
- [Ссылки](https://developer.mozilla.org/ru/docs/Web/HTML/Element/a) vs [кнопки](https://developer.mozilla.org/ru/docs/Web/HTML/Element/button)
- [Формы](https://developer.mozilla.org/ru/docs/Learn_web_development/Extensions/Forms), [`label`](https://developer.mozilla.org/ru/docs/Web/HTML/Element/label)
- [`img` и alt](https://developer.mozilla.org/ru/docs/Web/HTML/Element/img)
- [Скрытый контент `hidden`](https://developer.mozilla.org/ru/docs/Web/HTML/Global_attributes/hidden)
- Валидатор: [validator.w3.org](https://validator.w3.org/)

## Почему так

| Решение | Почему | Не берём |
| --- | --- | --- |
| Семантика, не «div-суп» | Скринридер и SEO опираются на теги | Всё в `div` «потому что потом CSS» |
| Карточка = `article` | Самостоятельный фрагмент: фото, название, цена | `div.card` без заголовка |
| Переход по сайту = `<a>`, отправка = `<button>` | Разный смысл для клавиатуры и Enter | `<div onclick>` |
| `label` связан с полем через `for`/`id` | Клик по тексту фокусирует input | Только `placeholder` как подпись |
| Вход и товар — отдельные страницы | Работает без CSS и без JS | Модалки (этап 4) и скрипт (этап 5) |
| Без БЭМ на этом этапе | Сначала смысл документа | Методология классов раньше тегов |

## Пошагово

1. Создайте `index.html`. Каркас:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>…</title>
  </head>
  <body>
    <header>…</header>
    <main>…</main>
    <footer>…</footer>
  </body>
</html>
```

`lang` ставьте по языку контента макета. Viewport нужен сразу, даже без CSS — иначе мобильный «приблизит» 980px.

2. В шапке: поиск (`form` + `input type="search"`), логотип как ссылка на главную (не `h1`, если главный заголовок — в герое), навигация каталога в `<nav><ul>`.
3. Герой: один `h1` на странице, абзац, ссылка «Shop now» на якорь каталога.
4. Каждая карточка:

```html
<article>
  <a href="product.html">
    <img src="…" alt="Название товара" width="400" height="500" />
    <h3>Название</h3>
  </a>
  <p>Категория</p>
  <p><data value="63.85">$63.85</data></p>
</article>
```

`width`/`height` уменьшают скачок вёрстки, когда файл догрузится ([MDN: width](https://developer.mozilla.org/ru/docs/Web/HTML/Element/img#width)).

5. Рассылка: `label` + `input type="email"` + `button type="submit"`. Не прячьте подпись: для этапа 1 она должна быть видна без CSS.
6. Account ведёт на `login.html`, карточка — на `product.html`. Это запасной путь без JS. Диалоги поверх страницы — этап 4.

## Проверка

Отключите CSS в DevTools. Должны читаться заголовки, списки, подписи полей. Один `h1`. Прогоните [валидатор](https://validator.w3.org/).

## Сдача

`stage-01-html/index.html` открывается двойным кликом.

Тест: [../tests/01-html.md](../tests/01-html.md)
