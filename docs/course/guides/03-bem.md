# Инструкция. Этап 3 — БЭМ

## Зачем этап

Одинаковый вид, другие имена. Студент видит, зачем методология: после «простых классов» селекторы начинают цепляться за DOM (`.header nav ul li a`) и ломаются при переносе карточки.

## Папка

`stage-03-bem/` — копия этапа 2, затем переименование.

Вводная лекция (разбор теста с примерами): [../lectures/03-bem/lecture.md](../lectures/03-bem/lecture.md), [живые примеры](../lectures/03-bem/examples.html).

## Теория

- [БЭМ: методология](https://ru.bem.info/methodology/)
- [Именование](https://ru.bem.info/methodology/naming-convention/)
- [Блок](https://ru.bem.info/methodology/key-concepts/#blok), [элемент](https://ru.bem.info/methodology/key-concepts/#element), [модификатор](https://ru.bem.info/methodology/key-concepts/#modifikator)
- Снова [специфичность](https://developer.mozilla.org/ru/docs/Web/CSS/Specificity) — один класс ≈ предсказуемый вес
- [class](https://developer.mozilla.org/ru/docs/Web/HTML/Global_attributes/class) — на узле может быть несколько классов (микс)

## Почему так

| Решение | Почему | Не берём |
| --- | --- | --- |
| Рефакторинг, а не старт с БЭМ | Сначала виден «зачем» | БЭМ в первый день HTML |
| `block__elem`, `block_mod` (классика БЭМ) | Один стиль на курс | Смешивать с `block--mod` (два дефиса, суффикс SUIT) без договорённости |
| Карточка — отдельный блок | Её переносят в модалку и сетку | `.products .item` завязан на родителя |
| Модификатор состояния `_selected` | JS потом только вешает класс | Инлайн `style` из скрипта |

Классика БЭМ vs «два дефиса» (`btn--primary`): оба валидны. На курсе **один** стиль, как в [документации bem.info](https://ru.bem.info/methodology/naming-convention/).

## Пошагово

1. Скопируйте `stage-02-css` → `stage-03-bem`.
2. Составьте таблицу переименований **до** правок:

| Было | Стало |
| --- | --- |
| `header-top` | `header__top` |
| `product-card-media` | `product-card__media` |
| `badge-sale` | `product-card__badge_type_sale` |

3. Меняйте HTML и CSS **парами**, иначе на полчаса останетесь без стилей.
4. Выкиньте селекторы из тегов:

```css
/* плохо: зависит от трёх обёрток */
.header nav ul li a { color: #1e2832; }

/* хорошо: элемент блока */
.menu a { color: #1e2832; }
```

5. Проверка независимости: вырежьте один `article.product-card` и вставьте в футер. Карточка должна выглядеть так же.

## Пример модификатора

```html
<p class="product-card__badge product-card__badge_type_sale">Sale</p>
```

Два класса: сам элемент бейджа и модификатор типа. Не сливайте в `product-card__badge-sale` без правила: тогда это уже не модификатор, а новый элемент.

## Проверка

Визуал = этап 2. Студент устно: «блок / элемент / модификатор» на шапке.

Тест: [../tests/03-bem.md](../tests/03-bem.md)
