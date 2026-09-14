# Вводная лекция. ООП в JavaScript

Этап 8 курса. Тема теста: [ООП в JavaScript](../../tests/08-oop.md) — общие правила классов, **не** про имена CSS Coral.

Живые примеры к этой лекции: [examples.html](examples.html) (открыть в браузере).

Эталон этапа: `stage-08-oop/`.  
Как разобрать код руками: [../../guides/08-oop.md](../../guides/08-oop.md).

Нужен локальный сервер: и `fetch`, и `type="module"` не работают с `file://`.

```
cd stage-08-oop
python -m http.server 8080
```

---

## Зачем эта лекция

На этапе 5 один IIFE, глобальный `PRODUCTS` и функции `openModal` / `loadProducts`. Когда появятся корзина и админка, такой файл не масштабируется: всё знает всё.

Этап 8 **не меняет поведение** магазина. Меняется устройство кода: данные, DOM, хранилище и точка входа становятся классами и ES-модулями.

На тесте правильный ответ почти всегда про **роль конструкции** (шаблон, экземпляр, «является» vs «имеет»), а не про SQL, CSS-селектор или HTTP-метод.

---

## 1. Класс и объект

Класс — это **шаблон**. Объект (экземпляр) — конкретная вещь, которую шаблон умеет штамповать. Шаблон сам по себе не карточка на витрине.

```js
export class Product {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.price = Number(data.price);
  }

  get priceLabel() {
    return "$" + this.price.toFixed(2);
  }
}

const joggers = new Product({
  id: "joggers",
  title: "Adicolor Classics Joggers",
  price: 63.85,
});
```

`Product` — класс. `joggers` — **instance**, конкретный объект через `new`. Не сам класс, не модуль Node и не протокол.

### `constructor`

Вызывается **при `new ClassName(...)`**. Не при `import`, не при сборке мусора, не при CSS hover.

В Coral у `Product` конструктор раскладывает JSON-строку в поля. У `Modal` — запоминает корневой DOM и вешает слушатели. У `App` — собирает зависимости, но **не** качает каталог (это `start()`, см. раздел 5).

### Забыли `new`

Класс в JS **нельзя** вызвать как обычную функцию. Без `new` будет ошибка (`TypeError` / unexpected `this`), экземпляр сам не появится.

```js
Product({ id: "joggers", title: "Joggers", price: 63.85 });
// TypeError: Class constructor Product cannot be invoked without 'new'
```

Это не `import` и не CSS.

### Статический метод

Вызывают **на классе, не на экземпляре**. В Coral валидация почты не принадлежит одной форме входа — это общее правило:

```js
export class FormValidator {
  static isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}

FormValidator.isEmail("admin@coral.local"); // true
new FormValidator(); // не нужен
```

Не «нельзя в JS», не «только приватный», не prototype HTML.

### Приватное поле `#name`

Синтаксис `#` делает член **недоступным снаружи класса**. Не `obj.#name` из чужого модуля, не CSS id, не глобал.

В Coral у `Modal` приватный `#bind()`: как именно повешены клики по оверлею, снаружи не зовут. `App` вызывает `open()` / `close()` — это интерфейс.

```js
class Modal {
  #bind() { /* слушатели */ }
  open() { this.root.classList.add("modal_open"); }
}

const dialog = new Modal(root);
dialog.open();     // можно
dialog.#bind();    // SyntaxError снаружи
```

### Геттер `get price()`

Читается **как свойство**, выполняется **как метод**. Не только для записи, не удаляет поле, не HTTP GET.

В Coral цена как число лежит в `this.price`, а подпись для витрины — геттер:

```js
const bag = new Product({ id: "nike-bag", title: "Nike Sportswear Futura Luxe", price: 130 });
bag.priceLabel;        // "$130.00" — скобок нет
bag.priceLabel();      // ошибка: это не функция
```

Так `ProductCard` пишет `this.product.priceLabel` в DOM, не дублируя `"$" + toFixed(2)` в трёх местах.

**На тесте:** класс-шаблон, instance через `new`, constructor, static, `#`, геттер, забытый `new`.

---

## 2. Отношения: инкапсуляция, «является», полиморфизм

### Инкапсуляция

**Спрятать внутренности, дать понятный интерфейс.** Не «только наследование», не глобальные переменные, не `eval`.

`StorageBox` прячет `JSON.parse` / `localStorage`. Снаружи — `read()`, `write()`, `clear()`. `UserSession` не знает, как сериализуется ключ `coral-user`.

Интерфейс класса для коллег — это **публичные методы, которые можно вызывать**. Приватные поля, имена CSS-файлов и порты — не интерфейс.

| Снаружи (можно) | Внутри (нельзя опираться) |
| --- | --- |
| `modal.open()` / `close()` | `#bind()`, `lastFocus` |
| `catalog.load()` / `render()` / `findById()` | `#fill()`, как устроен массив |
| `session.login(user)` | ключ StorageBox |

### `extends` — «является»

Наследник **получает поведение родителя**. Не копирует файлы диска, не CSS cascade, не SQL FOREIGN KEY.

Наследовать `Modal → AuthModal` разумно, потому что **логин-окно является модалкой**: открыть, закрыть, Esc, оверлей. Не потому что «так требует HTML» и не потому что иначе не будет CSS.

```js
export class AuthModal extends Modal {
  constructor(root, session, onLogin) {
    super(root); // конструктор родителя: root + #bind
    this.session = session;
    this.onLogin = onLogin;
  }
}
```

`ProductModal extends Modal` — то же: карточка товара в диалоге **является** модалкой.

### `super()` в конструкторе

Вызывает **конструктор родителя**. Не удаляет родителя, не `fetch`, не обязателен в каждом методе.

В наследнике `this` нельзя трогать до `super()`. Поэтому `AuthModal` сначала `super(root)`, потом свои формы.

### Override и `super.method()`

Переопределение — **своя реализация, при нужде вызов родителя**. Не удаляет родителя из памяти, не запрещено в ES6, не «только Python».

Полиморфизм упрощённо: **разные классы отвечают на один и тот же метод по-своему**. `open()` есть и у `Modal`, и у наследника. Код, который держит ссылку на модалку, зовёт `open()` — конкретный класс решает, что ещё сделать (фокус в поле, подставить товар).

```js
class ProductModal extends Modal {
  show(product) {
    this.product = product;
    this.titleNode.textContent = product.title;
    this.open(); // поведение родителя: класс modal_open, фокус
  }
}
```

`App` не пишет `if (это логин) … else if (это товар)`. Он зовёт `authModal.open()` и `productModal.show(product)`.

**На тесте:** инкапсуляция, extends, super(), полиморфизм, AuthModal является Modal, override.

---

## 3. Композиция: «имеет», не «является»

Композиция лучше наследования, когда связь **«имеет», а не «является»**. JS композицию поддерживает — это обычные поля с объектами.

```text
Catalog  имеет  Product[]  и рисует ProductCard
UserSession  имеет  StorageBox
Selection  имеет  StorageBox
App  имеет  Catalog, сессию, модалки
```

Каталог **не стоит** наследовать от `Array`, если это **сервис загрузки и отрисовки, не «вид списка»**. В JS классы можно писать, Array не запрещён, JSON как раз массивы — причина другая: у `Catalog` есть `url`, `load()`, `render()`, два корня DOM. Это не массив с `push`/`map` в роли основного смысла.

```js
export class Catalog {
  constructor(url, catalogRoot, bestsellersRoot) {
    this.url = url;
    this.items = []; // имеет список, не является Array
  }

  async load() {
    const rows = await (await fetch(this.url)).json();
    this.items = rows.map((row) => new Product(row));
  }
}
```

`UserSession` не наследуют от `StorageBox`: сессия **имеет** ящик. `StorageBox` не знает про «Account» в шапке.

Правило на доске: наследование только там, где «is a». Модалка входа — модалка. Каталог — не массив.

**На тесте:** композиция «имеет», Catalog не extends Array.

---

## 4. `this`, прототип, модули

### `this` при обычном вызове

В методе экземпляра при вызове `obj.method()` `this` — **сам объект**. Не всегда `window` в module, не класс, не `undefined` всегда.

```js
const session = new UserSession("coral-user");
session.displayName(); // this === session
```

### Потеря `this` в DOM-колбэке

Браузер вызывает слушатель как функцию, не как метод. `this` станет кнопкой или `undefined` (в module / strict). **Часто лечат стрелкой или `bind`.** Не «не бывает», не CSS, не PHP.

```js
// плохо: this внутри bump — не счётчик
button.addEventListener("click", counter.bump);

// хорошо
button.addEventListener("click", () => counter.bump());
button.addEventListener("click", counter.bump.bind(counter));
```

В Coral `BurgerMenu` сразу оборачивает: `() => this.toggle()`. Приватный `#bind` у `Modal` использует стрелку, чтобы `this.close()` закрывал модалку, а не оверлей.

### Prototype

В JS методы класса живут на `ClassName.prototype`. Prototype связан с **цепочкой, по которой ищут методы**. Не только CSS, cookie или JSON Schema.

`authModal.open` — это тот же `Modal.prototype.open`, пока наследник его не переопределил. Восемь `Product` не копируют `formatPrice` в каждый объект.

### `export class` и `type="module"`

Именованный экспорт **требует модуль**: атрибут `type="module"` у `<script>` или сборщик. Не только IIFE, не jQuery, не PHP.

```html
<script type="module" src="js/App.js"></script>
```

```js
import { Catalog } from "./Catalog.js";
import { AuthModal } from "./AuthModal.js";
```

`import { X } from './X.js'` — **именованный импорт**. Не CSS `@import`, не SQL, не HTTP PUT.

С `file://` модули часто падают (CORS). Поэтому на этапе 8, как на 5, нужен `python -m http.server`.

### Модуль без побочных эффектов

Хороший модуль **только объявляет и экспортирует, не лезет в DOM при import**. Не обязан сразу `querySelector`, не запрещён, не IIFE.

`Product.js`, `FormValidator.js`, `StorageBox.js` при импорте ничего не рисуют. Побочка в точке входа:

```js
const app = new App();
app.start();
```

Так `Product` можно импортировать в тесте без шапки Coral.

**На тесте:** this, потеря this, export/import, prototype, модуль без побочек.

---

## 5. Принципы: SRP, фасад, DRY, связность

### Одна задача (SRP)

Класс решает **одну задачу**. Не «один файл на весь проект», не «один метод в программе», не запрет модулей.

| Класс | Одна задача |
| --- | --- |
| `Product` | данные карточки, цена, бейдж |
| `ProductCard` | DOM одной карточки |
| `Catalog` | загрузка JSON, поиск, две сетки |
| `StorageBox` | localStorage |
| `UserSession` | вход / имя в шапке |
| `Selection` | выбранные id, рамка, бейдж |
| `FormValidator` | email и ошибки полей |
| `BurgerMenu` | меню на 768px |
| `CategoryTabs` | фильтр Best sellers |

### Фасад `App`

**Точка входа, прячет сложность.** Не вид SQL JOIN, не CSS Grid, не статус 204.

HTML знает один скрипт. `App` создаёт каталог, сессию, две модалки, бургер, вкладки; в `start()` грузит JSON; по клику на карточку открывает `ProductModal`. Модалки не знают про `localStorage`.

```text
App
 ├─ Catalog ── Product ── ProductCard
 ├─ UserSession ── StorageBox
 ├─ Selection ── StorageBox
 ├─ AuthModal ── Modal
 └─ ProductModal ── Modal
```

Антипаттерн напротив — **божественный объект**: один класс знает и делает всё. Не «много маленьких классов», не модули, не композиция. Если свалить fetch, валидацию, localStorage и Esc в `App.js` на 2000 строк — это божество, не фасад.

### DRY

**Не повторять одну и ту же логику копипастой.** Не «повторять обязательно», не только про CSS, не запрет функций.

Open/close/Esc жили бы в `AuthModal` и `ProductModal` дважды — вынесли в `Modal`. `JSON.parse` localStorage — в `StorageBox`, его используют и сессия, и выбор.

### Конструктор без тяжёлого fetch

Конструктор **не должен делать тяжёлый fetch без необходимости** — лучше метод `start` / `load`. Присваивать поля, вызывать `super` и существовать — нормально.

```js
constructor() {
  this.catalog = new Catalog("data/products.json", …);
  // не await fetch здесь
}

async start() {
  await this.catalog.load();
  this.catalog.render();
}
```

Иначе `new App()` в тесте уже ходит в сеть и падает без DOM.

### Связность (coupling)

Высокая, если **класс A лезет во внутренности B**. Вызов публичного метода B, наличие модулей и имён — не высокая связность сами по себе.

Плохо: `App` пишет `this.catalog.items[0].#sku` или правит `authModal.signinForm` в обход API. Хорошо: `this.catalog.findById(id)`, `this.authModal.open()`.

Тестировать метод легче, если **мало зависимостей от DOM и глобалов**. Не «всё в одном App.js», не «нет методов», не `alert`. `FormValidator.isEmail("a@b.c")` проверяется без страницы. `Product` — без `document`.

### Рефакторинг успешен

Если **поведение сохранилось, читать код стало проще**. Не «файлов меньше любой ценой», не «пропали тесты смысла», не «всё стало global».

Приёмка этапа 8 — те же сценарии, что на 5: карточка → модалка → Select без входа → Account; после входа выбор сохраняется; Esc закрывает; JSON рисует сетку. Появились файлы — это цена читаемости, не цель.

**На тесте:** SRP, фасад, божественный объект, DRY, конструктор без fetch, интерфейс, тест без DOM, coupling, критерий рефакторинга.

---

## Как отвечать на тесте

1. Отбросьте SQL, CSS-селектор, HTTP-метод, PHP — ловушки с других этапов.
2. Ищите **роль в коде**: шаблон vs экземпляр, «является» vs «имеет», публичный метод vs внутренности.
3. Если вопрос про синтаксис (`new`, `super()`, `#`, `get`, `import`) — что он меняет при выполнении, не «как покрасить кнопку».

После лекции: разберите эталон `stage-08-oop/` ([ДЗ этапа 8](../../08-oop.md)), поднимите `python -m http.server`, сравните с IIFE этапа 5, затем тест.
