import re
from pathlib import Path

path = Path(__file__).resolve().parent.parent / "stage-05-js" / "index.html"
text = path.read_text(encoding="utf-8")

mapping = {
    "Adicolor Classics Joggers": "joggers",
    "Nike Sportswear Futura Luxe": "nike-bag",
    "Geometric print Scarf": "scarf",
    "Yellow Reserved Hoodie": "hoodie",
    "Basic Dress Green": "green-dress",
    "Nike Air Zoom Pegasus": "pegasus",
    "Nike Repel Miler": "miler",
    "Glasses": "glasses",
}


def inject(match: re.Match[str]) -> str:
    block = match.group(0)
    if "data-product-id" in block:
        return block
    for title, pid in mapping.items():
        if f"<h3>{title}</h3>" in block:
            return block.replace(
                '<article class="product-card">',
                f'<article class="product-card" data-product-id="{pid}">',
                1,
            )
    return block


text = re.sub(r'<article class="product-card">[\s\S]*?</article>', inject, text)
path.write_text(text, encoding="utf-8")
print("ids", text.count("data-product-id"))
