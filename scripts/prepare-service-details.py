"""Patch service-details.html for local hosting and download missing asset refs."""
import re
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = "https://demo.egenslab.com/html/aploxn/preview/"
REF = ROOT / "_reference" / "service-details.html"
src = REF.read_text(encoding="utf-8", errors="ignore")


def decode_cfemail(encoded: str) -> str:
    key = int(encoded[:2], 16)
    return "".join(chr(int(encoded[i : i + 2], 16) ^ key) for i in range(2, len(encoded), 2))


def patch_cloudflare_emails(html: str) -> str:
    def anchor_with_span(m: re.Match[str]) -> str:
        email = decode_cfemail(m.group(1))
        return f'<a href="mailto:{email}">{email}</a>'

    html = re.sub(
        r'<a href="/cdn-cgi/l/email-protection#[^"]+">\s*<span class="__cf_email__" data-cfemail="([^"]+)"[^>]*>\[email[^\]]*\]</span>\s*</a>',
        anchor_with_span,
        html,
        flags=re.DOTALL,
    )

    def anchor_with_svg(m: re.Match[str]) -> str:
        inner = m.group(0)
        span = re.search(r'data-cfemail="([^"]+)"', inner)
        if span:
            email = decode_cfemail(span.group(1))
        else:
            email = decode_cfemail(m.group(1))
        inner = re.sub(
            r'href="/cdn-cgi/l/email-protection#[^"]+"',
            f'href="mailto:{email}"',
            inner,
        )
        inner = re.sub(
            r'<span class="__cf_email__" data-cfemail="[^"]+"[^>]*>\[email[^\]]*\]</span>',
            email,
            inner,
        )
        return inner

    html = re.sub(
        r'<a href="/cdn-cgi/l/email-protection#([^"]+)">.*?</a>',
        anchor_with_svg,
        html,
        flags=re.DOTALL,
    )
    html = re.sub(
        r'<span class="__cf_email__" data-cfemail="([^"]+)"[^>]*>\[email[^\]]*\]</span>',
        lambda m: decode_cfemail(m.group(1)),
        html,
    )
    return html


text = src
text = re.sub(
    r'<script data-cfasync="false" src="/cdn-cgi/scripts/[^"]+"></script>',
    "",
    text,
)
text = patch_cloudflare_emails(text)

(ROOT / "index.html").write_text(text, encoding="utf-8")

pattern = re.compile(r"""(?:src|href)=["'](assets/[^"'#?]+)""")
inline_urls = re.compile(r"""url\((assets/[^)]+)\)""")
refs = sorted(set(pattern.findall(text)) | {u.strip("'\"") for u in inline_urls.findall(text)})
missing = []
for r in refs:
    dest = ROOT / r
    if dest.is_file():
        continue
    missing.append(r)
    dest.parent.mkdir(parents=True, exist_ok=True)
    url = BASE + r.replace("\\", "/")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        dest.write_bytes(resp.read())
    print("downloaded", r)

print(f"refs={len(refs)} missing_before_fetch={len(missing)}")
still = [r for r in refs if not (ROOT / r).is_file()]
if still:
    print("STILL MISSING:", still)
    raise SystemExit(1)
