# -*- coding: utf-8 -*-
"""Convert course markdown tests to Moodle GIFT. Correct answer is always first."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "moodle"

FILES = [
    ("00-figma.md", "Макет и передача в вёрстку"),
    ("01-html.md", "HTML"),
    ("02-css.md", "CSS"),
    ("03-bem.md", "БЭМ"),
    ("04-modals.md", "Модальные окна"),
    ("05-js.md", "JavaScript"),
    ("06-server.md", "HTTP и сервер"),
    ("07-adaptive.md", "Адаптивная вёрстка"),
    ("08-oop.md", "ООП в JavaScript"),
    ("09-database.md", "Базы данных и SQL"),
    ("10-shop-admin.md", "Корзина, заказ, админка"),
]


def gift_escape(text: str) -> str:
    text = text.strip()
    text = text.replace("\\", "\\\\")
    for ch in "~=#{}:":
        text = text.replace(ch, "\\" + ch)
    return text


def parse_key(text: str) -> dict[int, str]:
    key: dict[int, str] = {}
    block = text.split("## Ключ", 1)[-1]
    for num, letter in re.findall(r"(\d+)\s*-\s*([A-D])", block):
        key[int(num)] = letter
    return key


def parse_questions(text: str) -> list[tuple[int, str, dict[str, str]]]:
    body = text.split("## Ключ", 1)[0]
    pattern = re.compile(
        r"^(\d+)\.\s+(.+)\n((?:[ \t]+-\s+[A-D]\)[^\n]*\n)+)",
        re.M,
    )
    items = []
    for match in pattern.finditer(body):
        num = int(match.group(1))
        question = " ".join(match.group(2).split())
        options: dict[str, str] = {}
        for letter, opt in re.findall(r"-\s+([A-D])\)\s+(.*)", match.group(3)):
            options[letter] = " ".join(opt.split())
        items.append((num, question, options))
    return items


def to_gift(stem: str, title: str, questions, key: dict[int, str]) -> str:
    lines = [
        f"// Moodle GIFT — {title}",
        "// Правильный ответ всегда первый (=). Импорт: Банк вопросов → Импорт → GIFT.",
        f"// Кодировка UTF-8. Категория: $COURSE$/Coral/{title}",
        "",
        f"$CATEGORY: $COURSE$/Coral/{title}",
        "",
    ]
    for num, question, options in questions:
        correct = key[num]
        order = [correct] + [L for L in "ABCD" if L != correct]
        lines.append(f"::{stem}-q{num:02d}::{gift_escape(question)} {{")
        for i, letter in enumerate(order):
            mark = "=" if i == 0 else "~"
            lines.append(f"    {mark}{gift_escape(options[letter])}")
        lines.append("}")
        lines.append("")
    return "\n".join(lines)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    combined: list[str] = [
        "// Moodle GIFT — все тесты курса Coral (330 вопросов).",
        "// Правильный ответ всегда первый (=).",
        "// Импорт: Банк вопросов → Импорт → GIFT, кодировка UTF-8.",
        "",
    ]
    for filename, title in FILES:
        text = (ROOT / filename).read_text(encoding="utf-8")
        key = parse_key(text)
        questions = parse_questions(text)
        if len(questions) != 30:
            raise SystemExit(f"{filename}: expected 30 questions, got {len(questions)}")
        if set(key) != set(range(1, 31)):
            raise SystemExit(f"{filename}: incomplete key {sorted(key)}")
        missing = [n for n, _, opts in questions if set(opts) != set("ABCD")]
        if missing:
            raise SystemExit(f"{filename}: questions without A–D: {missing}")
        stem = filename.replace(".md", "")
        gift = to_gift(stem, title, questions, key)
        out = OUT / f"{stem}.gift"
        out.write_text(gift, encoding="utf-8")
        combined.append(gift.rstrip())
        combined.append("")
        print("wrote", out.name, "questions", len(questions))
    all_path = OUT / "all.gift"
    all_path.write_text("\n".join(combined).rstrip() + "\n", encoding="utf-8")
    print("wrote", all_path.name)


if __name__ == "__main__":
    main()
