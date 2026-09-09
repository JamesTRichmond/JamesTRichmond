#!/usr/bin/env python3
"""Render the latest-activity block into README.md, between markers only.

Writes ONLY between <!--START_SECTION:activity--> and <!--END_SECTION:activity-->.
Never touches any other part of the file. Standard library only.
"""
import os, re, sys, json, urllib.request

USER   = os.environ.get("TARGET_USER", "JamesTRichmond")
TOKEN  = os.environ.get("GITHUB_TOKEN", "")
README = "README.md"
START  = "<!--START_SECTION:activity-->"
END    = "<!--END_SECTION:activity-->"
LIMIT  = 5


def api(url):
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": f"{USER}-profile-bot",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def describe(ev):
    repo = ev["repo"]["name"]
    link = f"https://github.com/{repo}"
    t = ev["type"]
    p = ev.get("payload", {})
    if t == "PushEvent":
        # The public events feed frequently omits the commit payload, and
        # reporting the length of a missing list means reporting "0 commits".
        n = p.get("size") or len(p.get("commits", []))
        if n:
            return f"Pushed {n} commit{'s' if n != 1 else ''} to [{repo}]({link})"
        return f"Pushed to [{repo}]({link})"
    if t == "CreateEvent":
        return f"Created {p.get('ref_type', 'a ref')} in [{repo}]({link})"
    if t == "PullRequestEvent":
        return f"{p.get('action', 'updated').capitalize()} PR #{p.get('number', '')} in [{repo}]({link})"
    if t == "IssuesEvent":
        return f"{p.get('action', 'updated').capitalize()} an issue in [{repo}]({link})"
    if t == "ReleaseEvent":
        return f"Published a release in [{repo}]({link})"
    if t == "WatchEvent":
        return f"Starred [{repo}]({link})"
    return None


def main():
    try:
        events = api(f"https://api.github.com/users/{USER}/events/public?per_page=60")
    except Exception as e:
        print(f"::warning::activity fetch failed: {e}")
        return 0

    lines, seen = [], set()
    for ev in events:
        d = describe(ev)
        if d and d not in seen:
            seen.add(d)
            lines.append(f"- {d}")
        if len(lines) >= LIMIT:
            break

    block = "\n".join(lines) if lines else "- Quiet stretch. Heads down."

    with open(README, encoding="utf-8") as f:
        src = f.read()

    if START not in src or END not in src:
        print("::error::activity markers missing from README.md")
        return 1

    new = re.sub(
        re.escape(START) + r".*?" + re.escape(END),
        f"{START}\n{block}\n{END}",
        src,
        flags=re.S,
    )

    if new != src:
        with open(README, "w", encoding="utf-8") as f:
            f.write(new)
        print(f"Updated activity block with {len(lines)} entries.")
    else:
        print("No change.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
