import re
import pathlib

text = (pathlib.Path(__file__).resolve().parents[1] / "_reference" / "contact.html").read_text(
    encoding="utf-8"
)


def decode_cfemail(encoded: str) -> str:
    key = int(encoded[:2], 16)
    return "".join(chr(int(encoded[i : i + 2], 16) ^ key) for i in range(2, len(encoded), 2))


for cf in sorted(set(re.findall(r'data-cfemail="([^"]+)"', text))):
    print(f"{cf} -> {decode_cfemail(cf)}")
