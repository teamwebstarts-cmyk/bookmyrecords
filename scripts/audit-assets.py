"""Verify assets/ paths referenced in HTML pages (src, href, url())."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERN = re.compile(
    r"""(?:src|href)=["'](assets/[^"'#?]+)|url\((?:["'])?(assets/[^"'#?)]+)"""
)


def refs_in(html_path: Path) -> set[str]:
    text = html_path.read_text(encoding="utf-8", errors="ignore")
    found: set[str] = set()
    for m in PATTERN.finditer(text):
        found.add(m.group(1) or m.group(2))
    return found


def main() -> int:
    pages = sorted(ROOT.glob("*.html"))
    if not pages:
        print("No HTML files at repo root.")
        return 1
    failed = False
    for page in pages:
        refs = sorted(refs_in(page))
        missing = [r for r in refs if not (ROOT / r).is_file()]
        print(f"\n{page.name}: {len(refs)} refs, {len(missing)} missing")
        for r in refs:
            mark = "MISSING" if r in missing else "ok"
            print(f"  [{mark}] {r}")
        if missing:
            failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
