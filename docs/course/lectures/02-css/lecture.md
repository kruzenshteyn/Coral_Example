# Вводная лекция. CSS: каскад, коробка, раскладка

Этап 2 курса. Тема теста: [CSS](../../tests/02-css.md) — общие правила стилей, **не** про имена классов Coral.

Живые примеры к этой лекции: [examples.html](examples.html) (открыть в браузере).

Эталон этапа: `stage-02-css/`.  
Как собрать стили руками: [../../guides/02-css.md](../../guides/02-css.md).

---

## Зачем эта лекция

HTML уже есть смысл. CSS решает **как это выглядит и как стоит**: цвет, коробка, ряд или сетка, слой, состояния. Без каскада «фиолетовый с макета» не попадёт на кнопку. Без блочной модели ширина 1320px разъедется из‑за padding. Без Flex шапка Coral не держит поиск / лого / Account в одной линии.

На этапе 2 классы ещё простые: `.header`, `.btn`, `.product-list`. БЭМ — следующий этап. Сначала каскад и коробка.

На тесте правильный ответ почти всегда про **механику CSS**, а не про SQL, DNS, Docker и HTTP.

---

## 1. Каскад и специфичность

Несколько правил могут целиться в одну кнопку. Браузер не «берёт случайное»: считает вес селектора и порядок в файле.

### Каскад

Каскад — **порядок, в котором конфликтующие правила перекрывают друг друга**. Не Flex, не минификация, не HTTP/2.

Порядок слоёв (упрощённо):

1. стили браузера (user agent);
2. ваши таблицы (`link`, `@import`);
3. внутри файла: **специфичность**;
4. при равной специфичности — **то, что ниже**.

```css
.btn { background: #1e2832; }          /* чёрная кнопка Coral */
.btn { background: #9e5cf2; }          /* это правило ниже — оно победит */
```

Два одинаковых `.btn` — выигрывает **нижнее** (вопрос 30). Длина имени класса не важна: `.product-card` не сильнее `.btn`.

### Специфичность

Грубо: `#id` > `.class` / атрибут / псевдокласс > `div` / псевдоэлемент > `*`.

| Селектор | Вес (a, b, c) | Кто победит |
| --- | --- | --- |
| `*` | 0, 0, 0 | почти никто |
| `div`, `a` | 0, 0, 1 | слабее класса |
| `.btn`, `:hover` | 0, 1, 0 | класс |
| `.a .b` | 0, 2, 0 | два класса |
| `#modal-auth` | 1, 0, 0 | id |

**`#id` выше** класса, тега и универсального селектора. В Coral id у модалок появятся на этапе 4 — не красьте ими каталог: id тяжелее, его потом не перебить классом.

### `.a .b` vs `.b`

**Первая выше:** два класса против одного. Не равны.

```css
.b { color: #1e2832; }
.a .b { color: #9e5cf2; } /* победит: 0,2,0 против 0,1,0 */
```

Пример: `.header .logo` перебьёт одиночный `.logo`. Поэтому на этапе 3 уйдём от длинных цепочек — но вес двух классов это уже сейчас.

### `!important`

**Ломает каскад, использовать редко.** Не обязателен в каждом правиле, не комментарий, селектор не отключает.

Оправдан в UA-стилях (`[hidden] { display: none !important }`) и в точечном override. В эталоне Coral `!important` в обычных правилах нет: токены и порядок файла справляются.

**На тесте:** каскад, `#id` выше, `.a .b` vs `.b`, `!important` редко, равная специфичность — нижнее правило.

---

## 2. Блочная модель

Каждый элемент — коробка: content, padding, border, margin. От того, *что входит в width*, зависит, влезет ли контейнер Coral в 1320px.

### `box-sizing: border-box`

**Padding и border входят в width.** Margin — нет, он снаружи.

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

.container {
  width: min(var(--container), calc(100% - 40px));
  /* 1320px уже «вся коробка», padding не прибавит ещё 40 */
}
```

Без этого `width: 1320px` + `padding: 20px` = 1360px — горизонтальный скролл.

### Width без border-box

По умолчанию (content-box) **width — это ширина content box**. Padding и border *добавляются* снаружи. Не «content + padding + border сразу в width» и не margin.

```text
content-box:  [  content 200  ] + pad 20 + border 2  → визуально 244
border-box:   [ pad 20 | content | pad 20 ] внутри width 200
```

### Margin collapsing

Схлопывание бывает у **вертикальных margin соседних блоков**. Горизонтальные не схлопываются. Padding не схлопывается. Grid/flex gap — не collapsing.

```css
h2 { margin-bottom: 24px; }
.product-list { margin-top: 24px; }
/* между ними не 48px, а 24: два вертикальных margin слились */
```

В Coral между секциями чаще `padding` у секции или `gap` у flex/grid — так проще предсказать ритм.

### `min-width` vs `width`

**`min-width` не даёт сжать ниже порога.** Это не синоним `width`, не «всегда больше width» и не только для flex.

```css
.search-form input {
  width: min(220px, 28vw);
  min-width: 120px; /* на узком экране поле не сожмётся в 40px */
}
```

Если одновременно `width: 200px` и `min-width: 300px` — победит порог 300. `max-width` режет сверху.

**На тесте:** border-box, collapsing вертикальные, width без border-box = content, min-width порог.

---

## 3. Flex и Grid

Раскладка этапа 2: шапка — flex, каталог — grid на 4 колонки. Float для сетки магазина не берём.

### Flex: направление

`display: flex` направляет детей **в ряд или колонку по `flex-direction`**. Не «только абсолютно», не в таблицу, не в другой документ.

```css
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 72px;
}
```

Поиск, логотип CORAL, Account — три зоны в ряд. `flex-direction: column` — то же, сверху вниз (бургер-меню на этапе 7).

### `flex: 1`

Часто значит: **элемент растягивается, занимая свободное место**. Не 1px, не z-index, не opacity.

```css
.hero-content { flex: 1; } /* заберёт оставшуюся ширину после фото */
```

`flex: 1` = `flex-grow: 1; flex-shrink: 1; flex-basis: 0` (в типичной записи). Два соседа с `flex: 1` делят место поровну.

### Grid: `gap` и доли `fr`

В Grid `gap` — **зазор между ячейками**, не цвет линии, не z-index, не шрифт.

```css
.product-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px; /* токен --gap */
}
```

`grid-template-columns: 1fr 2fr` — **вторая колонка вдвое шире первой из свободного места**. Не 1px и 2px, не три колонки, не Flex.

```text
[  1fr  ][      2fr      ]
  баннер фото    текст Zara
```

`fr` делит *остаток* после фиксированных треков и gap.

### `gap` в flex

**Поддерживается в современных браузерах как зазор.** Не только в HTML-таблицах, не HTML-атрибут, flex не удаляет.

```css
.user-nav {
  display: flex;
  gap: 24px; /* Account и Shopping без margin на каждом li */
}
```

Раньше писали `margin-right` на детях и обнуляли у последнего. `gap` проще и не ломает `:last-child`.

**На тесте:** flex-direction, grid gap, flex: 1, 1fr 2fr, gap в flex.

---

## 4. Позиция и слой

Бейдж Sale, липкая шапка, подпись на категории — это слой поверх потока, не новый HTML-документ.

### `position: absolute`

Позиционируется **относительно ближайшего предка с `position` не `static`**. Не всегда viewport (это ближе к `fixed`), не только `<html>`, не следующего sibling.

```css
.product-card { position: relative; }

.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
}
```

Карточка — positioned. Бейдж «Sale» сидит в углу фото, а не в углу окна.

Если ни один предок не positioned — отсчёт от initial containing block (как от страницы).

### `z-index`

Работает, **если есть позиционирование (не static) или элемент — flex/grid-item в контексте наложения**. Не у всех static, не только у `img`, не только в print.

```css
.header {
  position: sticky;
  top: 0;
  z-index: 20; /* шапка над каталогом при скролле */
}
```

`z-index: 999` на `position: static` ничего не даст. Сравнение z-index — внутри одного stacking context.

### `overflow: hidden`

**Обрезает содержимое, вылезающее из бокса.** Не удаляет DOM, не отключает JS, JPEG не сжимает.

```css
.product-card-media {
  overflow: hidden; /* «View product» и фото не вылезают за карточку */
}
```

Побочный эффект: создаёт блок форматирования, иногда режет `box-shadow` и sticky внутри. Для модалки на этапе 4 `overflow: hidden` ставят на `body`, чтобы страница под оверлеем не скроллилась.

**На тесте:** absolute от nearest positioned, z-index нужен position/flex/grid, overflow hidden обрезает.

---

## 5. Единицы и токены

Числа из макета не копируют десять раз. Их кладут в `:root` и считают относительно шрифта или контейнера.

### `em` и `rem`

`em` — **относительно шрифта элемента** (для самого `font-size` — родителя). Не всегда экран, не всегда корень, не 1px.

`rem` — **относительно корневого `font-size` (`html`)**. Не родителя, не viewport, не line-height соседа.

```css
html { font-size: 16px; }

.btn { font-size: 1.125rem; } /* 18px, не зависит от родителя */
.badge { padding: 0.25em 0.6em; } /* от своего кегля */
```

Вложенные `em` множатся: 1.2em внутри 1.2em = ещё крупнее. `rem` для кегля кнопок и отступов ритма предсказуемее.

### Кастомные свойства

Задают так: **`--accent: #333;` в правиле, часто `:root`**. Не `$accent` (это SCSS), не `var accent`, не `@color`.

Читают: **`var(--accent)`**. Не `$accent`, не `get()`, не `css.accent`.

```css
:root {
  --color-primary: #9e5cf2;
  --color-black: #1e2832;
  --container: 1320px;
  --gap: 24px;
}

.btn:hover { background: var(--color-primary); }
.badge-sale { background: var(--color-primary); }
```

Один токен — кнопки, бейджи, ховер ссылок. Сменили `--color-primary` — акцент Coral весь.

### `calc(100% - 40px)`

**Допустимое выражение ширины.** Не запрещено, не «только JS», не только SVG.

```css
.container {
  width: min(var(--container), calc(100% - 40px));
  margin-inline: auto;
}
```

На широком экране потолок 1320px. На узком — 100% минус по 20px с краёв. Пробелы вокруг `-` обязательны: `100%-40px` браузер может не разобрать.

**На тесте:** em, rem, `--accent` в `:root`, `var(--accent)`, calc.

---

## 6. Состояния и декор

Макет без hover — статичный кадр. В CSS состояния — отдельные селекторы, декор — иногда без лишнего HTML.

### `:hover`

Срабатывает **при наведении указателя**. Не только клик, не submit, не 404.

```css
.btn:hover {
  background: var(--color-primary);
}
```

В Coral кнопка default — чёрный `#1e2832`, hover — primary `#9e5cf2`. На тачскрине hover «залипает» — рядом всегда думают про фокус и активное состояние.

### `:focus-visible`

**Показывает фокус в основном при клавиатуре.** Не удаляет outline навсегда, не заменяет tabindex, не псевдоэлемент картинки.

```css
a:focus-visible,
button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}
```

Мышью кликнули — кольца может не быть. Tab до «Account» — кольцо есть. `outline: none` без замены ломает доступность.

### `::after`

Создаёт **виртуального ребёнка для декора**. Не новый HTTP-запрос обязательно, не SQL-триггер, не cookie.

```css
.hero .btn::after {
  content: "→";
}
```

Стрелка «Shop now» не лежит в HTML. Для `::before`/`::after` нужен `content` (хотя бы `""`). Это не в DOM для скриптов как обычный узел.

**На тесте:** `:hover` наведение, `:focus-visible` клавиатура, `::after` виртуальный ребёнок.

---

## 7. Картинки, медиа, шрифт, видимость

Каталог Coral держит ряд, только если фото одной высоты и шрифты подключены. Скрытие «на глаз» через opacity — не то же, что выключить блок.

### `object-fit: cover`

У `img` (и video) **заполняет бокс, края могут обрезаться**. Не stretch с искажением пропорций (это `fill`), картинку не прячет, SVG само по себе не делает.

```css
.product-card-media img {
  width: 100%;
  height: 320px;
  object-fit: cover;
}
```

Платье 3:4 и сумка 1:1 в одном ряду: `cover` обрежет лишнее, ряд ровный. `contain` впишет целиком — появятся поля. В эталоне бренды — `contain`, товары — `cover`.

### Наследование

Типично для **`color`, `font-family`**. Не для `margin`/`padding`, не «всегда border», не «всегда width».

```css
body {
  color: var(--color-black);
  font-family: var(--font-body); /* Open Sans — дети возьмут сами */
}
```

Карточка не пишет цвет заново. Отступы у `h3` и `.product-list` задают явно: они не «капают» с body как шрифт.

### `@media (max-width: 768px)`

Истинен, когда **ширина viewport ≤ 768px**. Не ≥ 768, не только печать, не только hover.

```css
@media (max-width: 768px) {
  .product-list {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

Это ширина окна, не ширина `.container`. На этапе 2 в эталоне уже заготовки 1100 / 768 / 480; полный адаптив — этап 7.

### `opacity: 0`

Элемент **невидим, но место и события зависят от других свойств**. Это не `display: none` (нет бокса, нет событий). Не всегда убирает из tab order как `hidden`. URL не меняет.

```css
.product-card-hover {
  opacity: 0; /* «View product» занимает место, клик ещё может дойти */
}
.product-card-media:hover .product-card-hover {
  opacity: 1;
}
```

`visibility: hidden` — места нет для попадания, но бокс в раскладке есть. Для модалки позже: `visibility` + `pointer-events`, не только opacity.

### `@font-face`

Шрифт подключают через **`@font-face` или `<link>` на CSS с `@font-face`**. Не тег `<font>`, не HTTP PUT, не `ALTER TABLE`.

```html
<link
  href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Roboto:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

Внутри того CSS — как раз `@font-face`. В Coral заголовки Roboto, текст Open Sans. Без подключения браузер возьмёт fallback — ритм макета поедет.

**На тесте:** object-fit cover, наследование color/font не margin, max-width 768 viewport, opacity 0 не display none, @font-face.

---

## Как отвечать на тесте

1. Отбросьте SQL, DNS, Docker, HTTP/2, JPEG «сжать файл» — ловушки с других этапов.
2. Ищите **механику**: что входит в width, от чего считается em, кому нужен position для z-index.
3. Если вопрос про селектор или каскад — сравните вес (`#id` / число классов) и порядок «кто ниже».

После лекции: подключить токены и сверстать Coral по макету ([ДЗ этапа 2](../../02-css.md)), сверить шапку-flex и сетку 4 колонок с эталоном `stage-02-css/`, затем тест.
