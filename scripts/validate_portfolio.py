#!/usr/bin/env python3
"""Check static portfolio documents without dependencies or network requests.

Run: python3 scripts/validate_portfolio.py
     python3 scripts/validate_portfolio.py --root /path/to/checkout --all-public

Checks local links, asset paths, HTML fragments, duplicate IDs, ARIA references,
image text alternatives, and basic
document structure. This is not a browser, an accessibility audit, or an
external-link availability check. JavaScript-created anchors are not inferred.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import unquote, urlsplit


DEFAULT_PAGES = ("index.html", "about/index.html", "resume/index.html", "work/onto/index.html")
RESOURCE_ATTRIBUTES = {
    "a": ("href",), "link": ("href",), "script": ("src",),
    "img": ("src",), "source": ("src",), "iframe": ("src",),
    "video": ("src", "poster"), "audio": ("src",), "object": ("data",),
}


@dataclass
class Reference:
    line: int
    attribute: str
    value: str


class Document(HTMLParser):
    def __init__(self, path: Path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids: dict[str, int] = {}
        self.duplicates: list[tuple[int, str]] = []
        self.references: list[Reference] = []
        self.aria_references: list[Reference] = []
        self.missing_image_alts: list[int] = []
        self.headings: list[tuple[int, int]] = []
        self.lang = ""
        self.viewport = ""
        self.description = ""
        self.title = ""
        self.title_count = 0
        self.in_head = False
        self.svg_depth = 0
        self.in_title = False
        self.main_count = 0
        self.base = False
        self.feed(path.read_text(encoding="utf-8"))
        self.close()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        line = self.getpos()[0]
        if tag == "head":
            self.in_head = True
        if tag == "svg":
            self.svg_depth += 1
        if tag == "html":
            self.lang = attrs.get("lang", "") or ""
        if tag == "base":
            self.base = True
        if tag == "meta":
            if attrs.get("name") == "viewport":
                self.viewport = attrs.get("content", "") or ""
            if attrs.get("name") == "description":
                self.description = attrs.get("content", "") or ""
        if tag == "title":
            self.in_title = self.in_head and self.svg_depth == 0
            if self.in_title:
                self.title_count += 1
        if tag == "main":
            self.main_count += 1
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self.headings.append((line, int(tag[1])))
        identifier = attrs.get("id")
        if identifier is not None:
            if not identifier or identifier in self.ids:
                self.duplicates.append((line, identifier))
            self.ids[identifier] = line
        if tag == "img" and "alt" not in attrs:
            self.missing_image_alts.append(line)
        for attribute in ("aria-labelledby", "aria-describedby", "aria-controls"):
            if attribute in attrs:
                self.aria_references.append(Reference(line, attribute, attrs[attribute] or ""))
        for attribute in RESOURCE_ATTRIBUTES.get(tag, ()):
            if attribute in attrs:
                self.references.append(Reference(line, f"{tag}[{attribute}]", attrs[attribute] or ""))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "svg" and self.svg_depth:
            self.svg_depth -= 1
        if tag == "head":
            self.in_head = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--all-public", action="store_true", help="Include existing public pages; omit tools and dot directories")
    parser.add_argument("--list-external", action="store_true", help="List external URLs, without fetching them")
    parser.add_argument("pages", nargs="*", help="Optional page paths relative to --root")
    args = parser.parse_args()
    root = args.root.resolve()
    pages = args.pages or list(DEFAULT_PAGES)
    if args.all_public:
        pages = sorted(str(p.relative_to(root)) for p in root.rglob("*.html")
                       if not any(part.startswith(".") or part in {"tools", "tests", "node_modules"}
                                  for part in p.relative_to(root).parts))
    cname = root / "CNAME"
    host = cname.read_text(encoding="utf-8").strip().lower() if cname.is_file() else ""
    documents: dict[Path, Document] = {}
    errors: list[str] = []
    external: set[str] = set()
    count = 0

    def document(path):
        if path not in documents:
            documents[path] = Document(path)
        return documents[path]

    for page in pages:
        path = (root / page).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            errors.append(f"{page}: missing page or path outside site root")
            continue
        doc = document(path)
        label = str(path.relative_to(root))
        if doc.base:
            errors.append(f"{label}: <base> is unsupported by this checker; resolve it before relying on results")
            continue
        for ok, message in (
            (bool(doc.lang.strip()), "missing document language"),
            ("width=device-width" in doc.viewport, "missing responsive viewport"),
            (doc.title_count == 1 and bool(doc.title.strip()), "expected one nonempty title"),
            (bool(doc.description.strip()), "missing description"),
            (sum(level == 1 for _, level in doc.headings) == 1, "expected one h1"),
            (doc.main_count == 1, "expected one main landmark"),
        ):
            if not ok:
                errors.append(f"{label}: {message}")
        previous = 0
        for line, level in doc.headings:
            if level > previous + 1:
                errors.append(f"{label}:{line}: heading jumps from h{previous} to h{level}")
            previous = level
        for line, identifier in doc.duplicates:
            errors.append(f"{label}:{line}: duplicate or empty id {identifier!r}")
        for line in doc.missing_image_alts:
            errors.append(f"{label}:{line}: img is missing an alt attribute")
        for ref in doc.aria_references:
            identifiers = ref.value.split()
            if not identifiers:
                errors.append(f"{label}:{ref.line}: empty {ref.attribute}")
            for identifier in identifiers:
                if identifier not in doc.ids:
                    errors.append(f"{label}:{ref.line}: {ref.attribute} refers to missing id {identifier!r}")
        for ref in doc.references:
            count += 1
            value = ref.value.strip()
            if not value:
                errors.append(f"{label}:{ref.line}: empty {ref.attribute}")
                continue
            url = urlsplit(value)
            if url.scheme in {"data", "mailto", "tel"}:
                continue
            if url.scheme == "javascript":
                errors.append(f"{label}:{ref.line}: javascript URL in {ref.attribute}")
                continue
            if url.netloc and url.hostname != host or url.scheme and url.scheme not in {"http", "https"}:
                external.add(value)
                continue
            if url.netloc and not host:
                external.add(value)
                continue
            relative = unquote(url.path)
            target = (root / relative.lstrip("/") if relative.startswith("/") or url.netloc
                      else path.parent / relative) if relative else path
            target = target.resolve()
            if target.is_dir():
                target /= "index.html"
            if not target.is_relative_to(root) or not target.is_file():
                errors.append(f"{label}:{ref.line}: missing local target {value!r}")
                continue
            fragment = unquote(url.fragment).split(":~:text=", 1)[0]
            if fragment and target.suffix.lower() == ".html" and fragment not in document(target).ids:
                errors.append(f"{label}:{ref.line}: missing fragment {value!r}")

    for error in errors:
        print(f"ERROR {error}")
    if args.list_external:
        for value in sorted(external):
            print(f"EXTERNAL (not fetched) {value}")
    print(f"Checked {len(pages)} pages and {count} HTML references: {len(errors)} errors. "
          f"{len(external)} external URLs were not fetched.")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
