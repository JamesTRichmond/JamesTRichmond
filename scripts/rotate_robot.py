#!/usr/bin/env python3
"""Point the README's robot at whatever he is doing today.

GitHub strips <script> out of a README, so the interactive robot cannot run
there. What survives the sanitizer is an image, and an image is allowed to
move — so six short loops of him live in assets/robot/ and this rewrites one
line of the README each morning to pick the day's.

Swapping the *filename* rather than overwriting one file is deliberate. A
committed GIF is roughly a hundred kilobytes of binary; rewriting the same path
daily would add that to the repository's history every single day. Rewriting a
URL adds one line.

The rotation is by ordinal date rather than random, so it is stable if the
workflow runs twice, and the sequence is a permutation rather than a straight
cycle so the same job never lands on the same weekday twice running.
"""

import datetime
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
README = ROOT / "README.md"
START = "<!--START_SECTION:robot-->"
END = "<!--END_SECTION:robot-->"

RAW = "https://raw.githubusercontent.com/JamesTRichmond/JamesTRichmond/main/assets/robot"
LIVE = "https://jamestrichmond.com/#habitat"

# 7 slots over 6 loops: the cycle and the week are coprime, so the schedule
# drifts and he is not always cooking on a Tuesday.
JOBS = [
    ("cook", "A small robot cooking. Click him and he becomes controllable."),
    ("ride", "A small robot riding a motorcycle. Click him and he becomes controllable."),
    ("service", "A small robot under a motorcycle, changing its oil. Click him and he becomes controllable."),
    ("climb", "A small robot climbing a rock face. Click him and he becomes controllable."),
    ("idle", "A small robot standing around in his workshop. Click him and he becomes controllable."),
    ("sleep", "A small robot asleep on a mat. Click him and he becomes controllable."),
]


def block_for(day: datetime.date) -> str:
    name, alt = JOBS[day.toordinal() % len(JOBS)]
    gif = ROOT / "assets" / "robot" / f"{name}.gif"
    if not gif.exists():
        raise SystemExit(f"::error::{gif} is missing; nothing to point at")
    return (
        f'<a href="{LIVE}">'
        f'<img src="{RAW}/{name}.gif" width="760" alt="{alt}" />'
        f"</a>"
    )


def main() -> int:
    src = README.read_text(encoding="utf-8")
    if START not in src or END not in src:
        print("::error::robot markers missing from README.md")
        return 1

    body = block_for(datetime.date.today())
    new = re.sub(
        re.escape(START) + r".*?" + re.escape(END),
        f"{START}\n{body}\n{END}",
        src,
        flags=re.S,
    )

    if new == src:
        print("Already on today's loop; nothing to do.")
        return 0

    README.write_text(new, encoding="utf-8")
    print(f"Robot set to: {body}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
