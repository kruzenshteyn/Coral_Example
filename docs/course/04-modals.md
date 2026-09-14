# Этап 4. Модалки

Общие правила диалогов — во [вводной лекции](lectures/04-modals/lecture.md), живые примеры: [lectures/04-modals/examples.html](lectures/04-modals/examples.html).

Папка: `stage-04-modals/`. Стили: `css/modal.css`.

- `#modal-auth` — вход и регистрация (вкладки).
- `#modal-product` — карточка товара.

Без JS открываются через `:target`: ссылка Account ведёт на `#modal-auth`, карточка — на `#modal-product`. Закрытие — ссылка на `#`. Класс `modal_open` понадобится на этапе 5.
