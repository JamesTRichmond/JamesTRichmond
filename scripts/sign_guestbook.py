#!/usr/bin/env python3
"""Append a sanitized guestbook signature. Input is UNTRUSTED public issue text."""
import os, re, sys, datetime

README = "README.md"
START  = "<!--START_SECTION:guestbook-->"
END    = "<!--END_SECTION:guestbook-->"
MAX_ENTRIES = 25
MAX_NOTE    = 100

signer = os.environ.get("SIGNER", "").strip()
raw    = os.environ.get("BODY", "")

# Username: GitHub allows alphanumeric and hyphens only. Anything else is forged.
if not re.fullmatch(r"[A-Za-z0-9-]{1,39}", signer):
    print("::error::invalid signer")
    sys.exit(1)

# Note: strip to a conservative safe charset, kill all markdown/HTML control
# characters, collapse whitespace, hard cap length.
note = raw.split("\n")[0] if raw else ""
note = re.sub(r"[^A-Za-z0-9 .,!?'’\-]", "", note)
note = re.sub(r"\s+", " ", note).strip()[:MAX_NOTE]

stamp = datetime.date.today().isoformat()
entry = f"- **[@{signer}](https://github.com/{signer})** — {note or 'signed'} · {stamp}"

with open(README, encoding="utf-8") as f:
    src = f.read()

if START not in src or END not in src:
    print("::error::guestbook markers missing")
    sys.exit(1)

block = re.search(re.escape(START) + r"(.*?)" + re.escape(END), src, re.S).group(1)
entries = [ln for ln in block.strip().split("\n") if ln.strip().startswith("- ")]

if any(f"[@{signer}]" in ln for ln in entries):
    print("Already signed; skipping.")
    sys.exit(0)

entries.insert(0, entry)
entries = entries[:MAX_ENTRIES]

new = re.sub(
    re.escape(START) + r".*?" + re.escape(END),
    START + "\n" + "\n".join(entries) + "\n" + END,
    src,
    flags=re.S,
)
with open(README, "w", encoding="utf-8") as f:
    f.write(new)
print(f"Signed by {signer}.")
