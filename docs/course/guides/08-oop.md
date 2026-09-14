# Инструкция. Этап 8 — ООП

## Зачем этап

На этапе 5 один IIFE и глобальный `PRODUCTS`. Когда появляются корзина и админка, такой файл не масштабируется. Классы режут ответственность: данные, DOM, хранилище, фасад.

Поведение страницы **не меняем** — меняем устройство кода.

## Папка

`stage-08-oop/`  
Точка входа: `js/App.js`

Вводная лекция (разбор теста с примерами): [../lectures/08-oop/lecture.md](../lectures/08-oop/lecture.md), [живые примеры](../lectures/08-oop/examples.html).

## Теория

- [Классы](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Classes)
- [`constructor`](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Classes/constructor), [`extends`](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Classes/extends), [`super`](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Operators/super)
- [Приватные поля `#`](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Classes/Private_properties)
- [Модули](https://developer.mozilla.org/ru/docs/Web/JavaScript/Guide/Modules), [`import`](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Statements/import) / [`export`](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Statements/export)
- [`this`](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Operators/this)
- Композиция vs наследование: [MDN: наследование и цепочка прототипов](https://developer.mozilla.org/ru/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain) (идея «является» vs «имеет»)

## Почему так

| Решение | Почему | Не берём |
| --- | --- | --- |
| ES-модули, не IIFE | Явные зависимости, строгий режим | Глобальные `function` в 12 тегах script |
| `AuthModal extends Modal` | Диалог входа **является** модалкой (открыть/закрыть/Esc) | Копипаста open/close |
| `Catalog` **содержит** `ProductCard` | Связь «имеет», не «является массивом» | `class Catalog extends Array` |
| `StorageBox` отдельно | localStorage один раз, без дубля JSON.parse | `localStorage` в каждом классе |
| `App` как фасад | HTML знает одну точку входа | Каждый виджет сам лезет в DOMContentLoaded |
| `type="module"` без Vite | Уже есть локальный сервер для fetch | Сборщик «как у взрослых» раньше времени |

Модули с `file://` часто не грузятся (CORS). Сервер как на этапе 5.

## Пошагово

1. Сервер из папки этапа: `python -m http.server 8080`.
2. В HTML один тег:

```html
<script type="module" src="js/App.js"></script>
```

3. Разнесите файлы (уже в эталонной папке — разберите, затем повторите с этапа 5):

```
Product.js        — данные и цена
ProductCard.js    — DOM карточки
Catalog.js        — fetch + две сетки
Modal.js          — open / close
AuthModal.js      — extends Modal
App.js            — new … и start()
```

4. Наследование только с `super()` в конструкторе наследника.
5. Приватные методы `#bind()` — деталь класса, не API для App.
6. Прогоните сценарии этапа 5: JSON, модалки, валидация, localStorage.

## Пример: композиция

```javascript
class App {
  constructor() {
    this.catalog = new Catalog("data/products.json", …);
    this.authModal = new AuthModal(document.getElementById("modal-auth"), …);
  }
  async start() {
    await this.catalog.load();
    this.catalog.render();
  }
}
```

App не рисует `<img>` сам и не знает про `password.length` — это чужие классы.

## Проверка

Нет `let PRODUCTS` в глобале. Студент показывает на доске: кто родитель модалки, кто не должен наследовать Array.

Тест: [../tests/08-oop.md](../tests/08-oop.md)
