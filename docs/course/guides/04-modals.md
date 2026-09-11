# Инструкция. Этап 4 — модальные окна

## Зачем этап

Попап — отдельный слой UI: оверлей, фокус, смысл «страница недоступна, пока открыт диалог». Сначала вёрстка, потом JS (этап 5).

## Папка

`stage-04-modals/`

## Теория

- [Диалоги и попапы (MDN, UI-паттерны)](https://developer.mozilla.org/ru/docs/Learn_web_development/Core/Accessibility/WAI-ARIA_basics)
- [`role="dialog"`](https://developer.mozilla.org/ru/docs/Web/Accessibility/ARIA/Roles/dialog_role)
- [`aria-modal`](https://developer.mozilla.org/ru/docs/Web/Accessibility/ARIA/Attributes/aria-modal)
- [`aria-labelledby`](https://developer.mozilla.org/ru/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby)
- [Псевдокласс `:target`](https://developer.mozilla.org/ru/docs/Web/CSS/:target) — открытие по hash без JS
- [`position: fixed`](https://developer.mozilla.org/ru/docs/Web/CSS/position)
- [Нативный `<dialog>`](https://developer.mozilla.org/ru/docs/Web/HTML/Element/dialog) — знать, на курсе делаем свой слой, чтобы понять механику

## Почему так

| Решение | Почему | Не берём |
| --- | --- | --- |
| Свой overlay + `fixed`, не сразу `<dialog>` | Видны z-index, оверлей, класс `_open` | «Магия» `.showModal()` без понимания |
| `:target` на этапе 4 | Работает без JS, прогрессивное улучшение | Только `alert()` / `prompt()` |
| Класс `modal_open` сразу в CSS | Этап 5 только переключает класс | `style.display` из JS |
| `hidden` убираем в пользу CSS visibility | Иначе `hidden` побеждает класс | Два механизма скрытия одновременно |
| Крестик — ссылка на `#` или `button` | Должен быть в порядке Tab | `<span>` с фоном-крестиком |

Нативный `<dialog>` правильный в проде ([HTML spec: dialog](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)). Здесь учебная цель — собрать слой руками.

## Пошагово

1. Разметка:

```html
<div
  class="modal"
  id="modal-auth"
  role="dialog"
  aria-modal="true"
  aria-labelledby="auth-title"
>
  <a class="modal__overlay" href="#" aria-label="Close"></a>
  <div class="modal__dialog">
    <a class="modal__close" href="#" aria-label="Close">&times;</a>
    <h2 id="auth-title">Account</h2>
    <!-- форма -->
  </div>
</div>
```

2. CSS: по умолчанию `visibility: hidden; pointer-events: none`. Открытое состояние:

```css
.modal_open,
.modal:target {
  visibility: visible;
  pointer-events: auto;
}
```

3. Ссылка Account: `href="#modal-auth"`. Клик даёт `:target` без скрипта.
4. Вторая модалка — карточка товара, шире (две колонки: фото и текст).
5. Формы внутри: у полей `label`, у кнопок в форме `type="submit"`, у крестика не submit.

## Пример: почему не `display: none` + `:target` в одном флаконе с `hidden`

Атрибут [`hidden`](https://developer.mozilla.org/ru/docs/Web/HTML/Global_attributes/hidden) в UA-стилях даёт `display: none !important` по сути сильнее обычного класса. Для этапа 5 удобнее один переключатель — класс.

## Проверка

Клик Account открывает диалог без JS. Tab доходит до крестика и полей. Оверлей перекрывает страницу.

Тест: [../tests/04-modals.md](../tests/04-modals.md)
