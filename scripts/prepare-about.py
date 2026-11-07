"""Patch about.html for local hosting and list/download missing assets."""
import re
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = "https://demo.egenslab.com/html/aploxn/preview/"
src = (ROOT / "_reference" / "about.html").read_text(encoding="utf-8", errors="ignore")

# Cloudflare email links -> plain mailto (same addresses as demo when decoded)
replacements = [
    (
        r'<a href="/cdn-cgi/l/email-protection#[^"]+">\s*<svg[^>]*>.*?</svg>\s*<span class="__cf_email__"[^>]*>\[email[^\]]*\]</span>\s*</a>',
        '<a href="mailto:infoaploxn@gmail.com">\n                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 14 10">\n                            <g>\n                                <path\n                                    d="M12.8333 0H1.16668C0.523223 0 0 0.498307 0 1.11112V8.88891C0 9.50169 0.523223 10 1.16668 10H12.8334C13.4768 10 14 9.50169 14 8.88888V1.11112C14 0.498307 13.4768 0 12.8333 0ZM1.16668 0.555547H12.8334C12.8763 0.555547 12.9142 0.570469 12.9545 0.578906C11.9445 1.4593 8.59532 4.37732 7.42328 5.38302C7.33157 5.46169 7.18375 5.55555 7.00003 5.55555C6.8163 5.55555 6.66848 5.46169 6.57647 5.38276C5.40455 4.37721 2.05518 1.45904 1.0453 0.578958C1.08571 0.570521 1.12366 0.555547 1.16668 0.555547ZM0.583324 8.88888V1.11112C0.583324 1.05669 0.600551 1.00732 0.615973 0.957578C1.38904 1.63143 3.72594 3.66747 5.24122 4.97979C3.73086 6.21539 1.39336 8.32602 0.614141 9.03367C0.600387 8.98643 0.583324 8.94023 0.583324 8.88888ZM12.8333 9.44445H1.16668C1.12008 9.44445 1.07866 9.42898 1.03515 9.41909C1.84034 8.68805 4.19273 6.56529 5.67654 5.35635C5.8461 5.50294 6.0159 5.64928 6.18595 5.79536C6.42636 6.00208 6.70775 6.11112 7 6.11112C7.29225 6.11112 7.57364 6.00206 7.81375 5.79562C7.98389 5.64945 8.1538 5.50303 8.32347 5.35635C9.80736 6.56516 12.1594 8.68776 12.9648 9.41909C12.9213 9.42898 12.88 9.44445 12.8333 9.44445ZM13.4167 8.88888C13.4167 8.94021 13.3996 8.98643 13.3859 9.03367C12.6064 8.32565 10.2691 6.21526 8.7588 4.97982C10.2741 3.6675 12.6107 1.63164 13.384 0.957526C13.3994 1.00727 13.4167 1.05667 13.4167 1.11109V8.88888Z" />\n                            </g>\n                        </svg>\n                        infoaploxn@gmail.com\n                    </a>',
        2,
    ),
]
# Simpler approach: line-based patches
text = src
text = re.sub(
    r'<script data-cfasync="false" src="/cdn-cgi/scripts/[^"]+"></script>',
    "",
    text,
)
text = text.replace(
    'href="/cdn-cgi/l/email-protection#630a0d050c02130f0c1b0d23040e020a0f4d000c0e"',
    'href="mailto:infoaploxn@gmail.com"',
)
text = text.replace(
    'href="/cdn-cgi/l/email-protection#51383f373e30213d3e293f11363c30383d7f323e3c"',
    'href="mailto:infoaploxn@gmail.com"',
)
text = text.replace(
    'href="/cdn-cgi/l/email-protection#1a73747c755a7d777b737634797577"',
    'href="mailto:info@gmail.com"',
)
text = re.sub(r'<span class="__cf_email__"[^>]*>\[email[^\]]*\]</span>', "infoaploxn@gmail.com", text, count=2)
text = re.sub(
    r'<span class="__cf_email__"[^>]*data-cfemail="e78e898188a7808a868e8bc984888a"[^>]*>\[email[^\]]*\]</span>',
    "info@gmail.com",
    text,
)

(ROOT / "index.html").write_text(text, encoding="utf-8")

pattern = re.compile(r"""(?:src|href)=["'](assets/[^"'#?]+)""")
refs = sorted(set(pattern.findall(text)))
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
