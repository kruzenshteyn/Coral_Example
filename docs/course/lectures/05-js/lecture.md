# Вводная лекция. JavaScript в браузере

Этап 5 курса. Тема теста: [JavaScript в браузере](../../tests/05-js.md) — общие правила языка и DOM, **не** про имена функций Coral.

Живые примеры к этой лекции: [examples.html](examples.html) (открыть в браузере).

Эталон этапа: `stage-05-js/`.  
Как собрать поведение руками: [../../guides/05-js.md](../../guides/05-js.md).

---

## Зачем эта лекция

HTML описывает документ, CSS — вид. JavaScript в браузере **оживляет** страницу: достаёт каталог, открывает модалку, запоминает выбор, проверяет email.

На этапе 5 эталон Coral делает четыре вещи:

- `fetch("data/products.json")` и рисует карточки в `[data-catalog]`;
- выбранные товары пишет в `localStorage` (`coral-selected`);
- модалку открывает классом `modal_open`, закрывает Esc и кликом по оверлею;
- email проверяет регулярным выражением — приближением, не RFC.

`fetch` с `file://` не работает. Нужен локальный сервер: из `stage-05-js` выполнить `python -m http.server 8080`.

На тесте правильный ответ почти всегда про **поведение языка или DOM**, а не про SQL, DNS, PHP-константы и Wi‑Fi.

---

## 1. Язык: привязки, сравнение, строгий режим

### `const` — привязку нельзя переназначить

`const` запрещает **переназначить имя**. Объект при этом не заморожен: свойства менять можно. Это не глобальная константа PHP и не `Object.freeze`.

```js
const STORAGE_KEY = "coral-selected";
STORAGE_KEY = "other"; // TypeError: Assignment to constant variable

const user = { email: "a@b.c" };
user.email = "new@b.c"; // ок: тот же объект, другое свойство
```

В Coral ключи хранилища — `const STORAGE_KEY` и `const USER_KEY`. Их не переписывают. Массив выбранных id внутри уже другой истории: его мутируют через `push`.

### `let` vs `var`

`let` живёт в **блоке** `{ … }`. `var` — в функции (или глобально) и всплывает. `let` не «только в Node» и не константа.

```js
if (true) {
  let ids = ["joggers"];
  var leaked = 1;
}
// ids — ReferenceError
// leaked === 1
```

Цикл `for (let i = 0; …)` даёт каждой итерации свою `i` — удобно в замыканиях. С `var` все слушатели увидят последнее значение.

### `===` без приведения

`===` сравнивает **без приведения типов**. `==` приводит. Не «только числа» и не «только строки».

```js
0 == "0";   // true  — строка стала числом
0 === "0";  // false — разные типы
"" == 0;    // true
"" === 0;   // false
```

В коде Coral сравнение id — через `===` / `includes` у массива строк. Не смешивайте число `1` и строку `"1"` в `data-product-id`.

### `null == undefined` и `typeof null`

`null == undefined` даёт **true** (особый случай `==`). `null === undefined` — false.

`typeof null` возвращает **`"object"`** — историческая особенность языка, не `"null"` и не `"undefined"`. Проверка «есть ли значение» надёжнее через `== null` (поймает оба) или явное `=== null` / `=== undefined`.

```js
typeof null;        // "object"
typeof undefined;   // "undefined"
document.querySelector(".no-such") === null; // true, если узла нет
```

### `'use strict'`

Строгий режим **запрещает молчаливые ошибки**: присвоение необъявленной переменной бросает исключение, `this` в обычной функции не становится `window`. Он не ускоряет Wi‑Fi и не включает jQuery.

Модули (`type="module"`) всегда в строгом режиме. IIFE в `main.js` Coral можно писать без директивы — но привычка `'use strict'` в обычном скрипте спасает от `user = …` без `let`.

### `try/catch`

Ловит **исключения в синхронном коде блока** и `await` внутри `async`. Не ловит ошибки CSS, падение ОС и 404 у `<img>`.

```js
function getSelected() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (error) {
    return [];
  }
}
```

Битая строка в `localStorage` не должна ронять каталог. Сеть через `fetch` в `try/catch` поймаете, только если промис **отклонился** (нет сети, CORS). HTTP 404 сам по себе исключение не бросает — об этом в следующем разделе.

**На тесте:** `const`, `let`/`var`, `===`, `null == undefined`, `typeof null`, `use strict`, `try/catch`.

---

## 2. DOM и события

### `querySelector` — первый или `null`

`document.querySelector('.item')` вернёт **первый подходящий элемент или `null`**. Не массив, не CSS-правило, не NodeList всех html.

```js
const catalog = document.querySelector("[data-catalog]");
const burger = document.querySelector(".burger");
const authModal = document.getElementById("modal-auth");
```

Все совпадения — `querySelectorAll`: это NodeList. Если узла нет, у `querySelector` будет `null` — вызов `.classList` на нём бросит. В Coral перед работой проверяют `if (burger && menu)`.

### `addEventListener`

Подписывает обработчик. Не заменяет HTML, не делает HTTP POST «всегда» и не удаляет узел.

```js
burger.addEventListener("click", () => {
  const open = menu.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", String(open));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAll();
});
```

Снять слушатель — `removeEventListener` с той же функцией. `onclick = fn` затирает предыдущий обработчик; `addEventListener` складывает несколько.

### `preventDefault`

Отменяет **действие браузера по умолчанию**: переход по ссылке, отправку формы, контекстное меню. Не удаляет обработчик и не чистит DNS.

```js
const accountLink = event.target.closest('a[href="#modal-auth"]');
if (accountLink) {
  event.preventDefault();
  openModal(authModal);
}

signinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  // своя проверка email, без перезагрузки страницы
});
```

В Coral ссылка Account ведёт на `#modal-auth`. Без `preventDefault` страница прыгнет к якорю. Клик по оверлею тоже `preventDefault`, затем `closeModal`.

### Делегирование: родитель + `target`

Слушают **родителя** и смотрят `event.target` (часто через `closest`). Не копируют listener на каждую карточку вручную и не путают с WebSocket.

```js
document.addEventListener("click", (event) => {
  const productLink = event.target.closest(".product-card__media");
  if (productLink) {
    const card = productLink.closest("[data-product-id]");
    const product = card && findProduct(card.dataset.productId);
    if (product) {
      event.preventDefault();
      fillProductModal(product);
      openModal(productModal);
    }
  }

  if (event.target.closest(".modal__close, .modal__overlay")) {
    event.preventDefault();
    closeModal(event.target.closest(".modal"));
  }
});
```

Карточки появляются **после** `fetch`. Если вешать слушатель на каждую в `renderCard`, новые узлы его не получат. Делегирование на `document` переживает перерисовку каталога.

### `target` vs `currentTarget`

`target` — **источник** события (кнопка, картинка, текст внутри). `currentTarget` — **элемент, на котором висит слушатель**. Это не синонимы.

Клик по «View product» внутри карточки: `target` может быть `<img>` или `<span>`, `currentTarget` при слушателе на `document` — сам `document`. Поэтому в Coral берут `event.target.closest(".product-card__media")`, а не сравнивают `target` с карточкой напрямую.

### `classList.toggle`

Добавит класс, если его не было, или снимет, если был. Не удаляет элемент и не меняет `tagName`.

```js
modal.classList.add("modal_open");
document.body.classList.add("modal-open");

card.classList.toggle("product-card_selected", ids.includes(card.dataset.productId));
menu.classList.toggle("is-open");
```

Второй аргумент — принудительно вкл/выкл. Открытая модалка Coral — наличие `modal_open`, не атрибут `hidden` с этапа 4.

### `dataset.productId` = `data-product-id`

`element.dataset.productId` читает HTML-атрибут **`data-product-id`**. В разметке kebab-case, в JS — camelCase. Не `data-productId` в HTML, не `id="productId"` и не `name`.

```js
article.dataset.productId = product.id;
// в DOM: data-product-id="adicolor-classics-joggers"

const id = card.dataset.productId;
```

Так карточка знает, какой товар открывать в модалке и какой id класть в `coral-selected`.

### `DOMContentLoaded` и скрипт в конце `body`

`DOMContentLoaded` значит: **HTML разобран, узлы можно искать**. Это не «все картинки 100% загружены» (для картинок — `window` `load`) и не про CSS.

Скрипт в конце `<body>` видит **DOM выше уже**: парсер дошёл до тега и узлы шапки, каталога, модалок на месте. Не «запрещён» и не «не видит DOM».

```html
<script src="js/products.js"></script>
<script src="js/main.js"></script>
</body>
```

В Coral скрипты в конце `body` без `defer`: к моменту выполнения `#modal-auth` и `[data-catalog]` уже в дереве. `type="module"` и так откладывается как `defer` — его можно ставить в `head`.

**На тесте:** `querySelector`, `addEventListener`, `preventDefault`, делегирование, `classList.toggle`, `dataset`, `target` vs `currentTarget`, `DOMContentLoaded`, скрипт в конце `body`.

---

## 3. Сеть и async

### `JSON.parse` бросает

Невалидная строка → **исключение** (`SyntaxError`). Не тихий `{}` и не перезагрузка страницы.

```js
JSON.parse('{"id":"joggers"}'); // объект
JSON.parse("{");                // SyntaxError
JSON.parse("undefined");        // SyntaxError
```

Поэтому вокруг `localStorage.getItem` в Coral стоит `try/catch`. Пустая кавычка `""` тоже невалидна — подставляют `"[]"`.

`response.json()` внутри использует тот же разбор: битый ответ сервера тоже уйдёт в `catch`.

### `fetch` не бросает на 404

По умолчанию `fetch` **не бросает на HTTP 404**. Смотрят `response.ok` (истина для 200–299) или `response.status`. Бросает сеть: нет соединения, оборвали, CORS, `file://`.

```js
async function loadProducts() {
  const response = await fetch("data/products.json");
  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }
  PRODUCTS = await response.json();
  return PRODUCTS;
}

loadProducts().then(renderProductLists).catch(showCatalogError);
```

404 «файла нет» — это успешный с точки зрения сети ответ «ресурс не найден». Без проверки `ok` вы начнёте парсить HTML-страницу 404 как JSON.

### `async` всегда возвращает Promise

Даже `return 5` обернётся в `Promise.resolve(5)`. Не «только string» и не синхронный void.

```js
async function loadProducts() { /* … */ }
loadProducts(); // Promise
```

Ошибку из `async` ловят `.catch` или `try/catch` с `await`. Голый `throw` внутри async отклоняет промис, а не валит весь скрипт сразу.

### `await` — в `async` или top-level module

`await` можно в **async-функции** и на верхнем уровне модуля. Не в любом старом скрипте, не в CSS и не в HTML-атрибуте.

```js
const products = await loadProducts(); // только внутри async / module
```

В обычном `main.js` Coral вызывают `loadProducts().then(…)`, потому что файл не модуль.

### `type="module"`

Включает **`import`/`export`**, по умолчанию ведёт себя как **`defer`** (ждёт разбора HTML, сохраняет порядок). Всегда strict. Это не CommonJS (`require`) нативно в браузере и не «file:// без ограничений».

```html
<script type="module" src="js/main.js"></script>
```

```js
import { loadProducts } from "./products.js";
```

На этапе 5 в эталоне ещё обычные скрипты и глобальный `PRODUCTS`. Модули появятся как приём позже; на тесте спрашивают поведение `type="module"`.

### `file://` и CORS

Побочный эффект без сервера: **`fetch` локального JSON с `file://` / CORS блокируют**. Не «JSON нельзя», не «нужен SQL» и не «обязательно PHP».

Браузер считает каждый файл отдельным origin. Запрос `data/products.json` со страницы `file:///…/index.html` режется. Сообщение Coral:

> Could not load data/products.json. Open this folder through a local server.

Запуск: `python -m http.server 8080` из `stage-05-js`, открыть `http://localhost:8080/`. Тогда origin один: `http://localhost:8080`.

**На тесте:** `JSON.parse`, `fetch` + `ok`, `async` → Promise, `await`, `type="module"`, `file://`.

---

## 4. Данные, массивы, замыкание, debounce

### `localStorage` — строки того же origin

Хранит **строки**. Объекты кладут через `JSON.stringify`, читают `JSON.parse`. Видны **JS того же origin** (схема + хост + порт). Не серверу, не всем сайтам, не как HttpOnly cookie и не SQL.

```js
localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
```

В Coral после входа «Select product» пишет id в `coral-selected`. Рамка `product-card_selected` и бейдж корзины переживают перезагрузку. `coral-user` — сессия на клиенте (на этапе 6 её заменит cookie).

Другой порт (`localhost:8080` vs `localhost:8000`) — другой origin, своё хранилище. Incognito — отдельное, после закрытия окна часто пустое.

### Замыкание

Функция **помнит лексическое окружение**, где её объявили. Не HTTP-заголовок и не CSS-специфичность.

```js
function openModal(modal) {
  lastFocus = document.activeElement;
  modal.classList.add("modal_open");
}

function closeModal(modal) {
  modal.classList.remove("modal_open");
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
}
```

`closeModal` закрывает тот `modal` и возвращает фокус в `lastFocus`, хотя событие пришло позже. Обработчик `click` на кнопке Select видит `activeProductId` из внешней области.

### `map` и `filter`

`map` строит **новый массив той же длины**, прогнав функцию по каждому элементу. `filter` оставляет те, для которых предикат истинен.

```js
[1, 2, 3].map((x) => x * 2);      // [2, 4, 6]
[1, 2, 3].filter((x) => x > 1);   // [2, 3]

catalog.replaceChildren(...products.map(renderCard));
const featured = products.filter((product) => product.bestseller);
```

`map` не суммирует в `6` и не возвращает исходный массив. `filter` не даёт `true` и не «первый элемент».

### Regex email — приближение, не RFC

`/^[^\s@]+@[^\s@]+\.[^\s@]+$/` ловит очевидный мусор. Это **не полная RFC**, не MX-запись и не гарантия доставки. Шифрованием тоже не является.

```js
function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const emailBad = !isEmail(email.value);
if (emailBad || passBad) return; // форму не «отправляем»
```

`a@b.c` пройдёт, `"не почта"` — нет. Настоящую проверку всё равно делает сервер (этап 6). Клиент — удобство.

### Debounce

**Откладывает вызов, пока пользователь печатает.** Не удаляет `input` и не SQL INDEX.

```js
function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

searchInput.addEventListener("input", debounce((event) => {
  filterCatalog(event.target.value);
}, 300));
```

Без debounce каждая буква — работа по каталогу (или запрос на сервер). С debounce срабатывает пауза ~300 мс после последнего нажатия. В Coral на этапе 5 фильтрация Best sellers мгновенная; приём пригодится поиске.

### `push` vs `concat`

`push` **меняет исходный** массив и возвращает новую длину. `concat` / `[...]` возвращают **новый**, исходный не трогают.

```js
const ids = getSelected();
if (!ids.includes(activeProductId)) ids.push(activeProductId);
setSelected(ids);

const next = ids.concat(activeProductId); // ids без изменений
const next2 = [...ids, activeProductId];
```

Не «одинаково всегда» и не наоборот. Если массив заморожен (`Object.freeze`) — `push` бросит в strict; обычный массив Coral не заморожен.

**На тесте:** `localStorage`, origin, замыкание, `map`, `filter`, regex email, debounce, `push`/`concat`.

---

## Как отвечать на тесте

1. Отбросьте SQL, DNS, PHP-константы, Wi‑Fi, Docker — ловушки с других этапов.
2. Ищите **поведение**: что возвращает (`null` / Promise / новый массив), что бросает, что мутирует.
3. Если вопрос про DOM или событие — кто слушает, что отменяет браузер, какой атрибут читает `dataset`.

После лекции: поднять `python -m http.server 8080` в `stage-05-js`, прогнать сценарии ([ДЗ этапа 5](../../05-js.md)): карточка → модалка → Select без входа → Account; рамка после перезагрузки; Esc и оверлей; невалидный email. Затем тест.
