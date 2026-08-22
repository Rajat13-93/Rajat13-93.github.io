"""Run lightweight, dependency-free checks on the static academic website."""

from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parent
HTML = ROOT / "index.html"
CSS = ROOT / "styles.css"


class SiteParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []
        self.anchor_targets: set[str] = set()
        self.local_assets: list[str] = []
        self.blank_without_noopener: list[str] = []
        self.images_without_alt: list[str] = []
        self.publication_count = 0
        self.h1_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        identifier = attributes.get("id")
        if identifier:
            self.ids.append(identifier)

        classes = set((attributes.get("class") or "").split())
        if "publication" in classes:
            self.publication_count += 1
        if tag == "h1":
            self.h1_count += 1

        if tag == "a":
            href = attributes.get("href") or ""
            if href.startswith("#") and len(href) > 1:
                self.anchor_targets.add(href[1:])
            if attributes.get("target") == "_blank" and "noopener" not in (
                attributes.get("rel") or ""
            ).split():
                self.blank_without_noopener.append(href)

        if tag == "img" and "alt" not in attributes:
            self.images_without_alt.append(attributes.get("src") or "")

        asset_value = None
        if tag in {"link", "a"}:
            asset_value = attributes.get("href")
        elif tag in {"script", "img"}:
            asset_value = attributes.get("src")
        if asset_value and not asset_value.startswith(("http:", "https:", "mailto:", "#")):
            self.local_assets.append(asset_value)


def main() -> None:
    parser = SiteParser()
    parser.feed(HTML.read_text(encoding="utf-8"))
    duplicate_ids = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
    missing_anchors = sorted(parser.anchor_targets - set(parser.ids))
    missing_assets = sorted(
        {item for item in parser.local_assets if not (ROOT / item).exists()}
    )
    css_text = CSS.read_text(encoding="utf-8")
    css_errors = [] if css_text.count("{") == css_text.count("}") else ["Unbalanced braces"]

    report = {
        "duplicate_ids": duplicate_ids,
        "missing_anchors": missing_anchors,
        "missing_assets": missing_assets,
        "blank_without_noopener": parser.blank_without_noopener,
        "images_without_alt": parser.images_without_alt,
        "css_parse_errors": css_errors,
        "publication_count": parser.publication_count,
        "h1_count": parser.h1_count,
    }

    print(report)
    failures = [
        duplicate_ids,
        missing_anchors,
        missing_assets,
        parser.blank_without_noopener,
        parser.images_without_alt,
        css_errors,
    ]
    if any(failures) or report["publication_count"] != 9 or report["h1_count"] != 1:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
