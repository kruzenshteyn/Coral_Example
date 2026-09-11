"""Copy stage-02 into stage-03 and rename classes to BEM."""
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "stage-02-css"
DST = ROOT / "stage-03-bem"

if DST.exists():
    shutil.rmtree(DST)
shutil.copytree(SRC, DST)

REPLACEMENTS = [
    ("product-card-selected", "product-card_selected"),
    ("product-card-media", "product-card__media"),
    ("product-card-hover", "product-card__hover"),
    ("product-card-cat", "product-card__category"),
    ("product-card-price", "product-card__price"),
    ("badge-sale", "product-card__badge_type_sale"),
    ("badge-hot", "product-card__badge_type_hot"),
    ("header-actions", "header__actions"),
    ("header-top", "header__top"),
    ("hero-gallery", "hero__gallery"),
    ("hero-content", "hero__content"),
    ("bestsellers-head", "bestsellers__head"),
    ("banner-content", "banner__content"),
    ("banner-percent", "banner__percent"),
    ("footer-grid", "footer__grid"),
    ("footer-about", "footer__about"),
    ("footer-bar", "footer__bar"),
    ("product-list", "products__list"),
    ("show-all", "bestsellers__more"),
    ("logo-zara", "banner__brand"),
    ("is-active", "tabs__link_active"),
    ("badge", "product-card__badge"),
]


def transform(text: str) -> str:
    for old, new in REPLACEMENTS:
        text = re.sub(rf"(?<![\w-]){re.escape(old)}(?![\w-])", new, text)
    return text


for path in DST.rglob("*"):
    if path.suffix in {".html", ".css", ".md"}:
        path.write_text(transform(path.read_text(encoding="utf-8")), encoding="utf-8")
        print("bem", path.relative_to(DST))
