#!/usr/bin/env python3
"""
build_subject_pages.py — stamp out the subject pages from one shell.

Six pages that share a head, a top bar, a footer and a room-switcher is six
chances for them to drift apart. The content lives in PAGES below; the chrome
lives in SHELL; and running this writes real static HTML into the repo, which
is what GitHub Pages actually serves. Nothing is generated at request time.

    python3 scripts/build_subject_pages.py

/usaf/ is written by hand and is deliberately not in here — it is long enough
and particular enough that a template would have fought it.
"""

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

ROOMS = [
    ("usaf", "USAF"),
    ("teacher", "Teacher"),
    ("agents", "AI Agents"),
    ("security", "Security"),
    ("python", "Python"),
    ("typescript", "TypeScript"),
]

FAVICON = (
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"
    "<rect width='100' height='100' rx='22' fill='%23472e1c'/>"
    "<rect x='24' y='30' width='52' height='40' rx='10' fill='%23f2cf4a'/>"
    "<rect x='34' y='44' width='32' height='11' rx='5.5' fill='%2340f58a'/>"
    "<rect x='46' y='14' width='8' height='16' rx='4' fill='%23f2cf4a'/>"
    "<circle cx='50' cy='12' r='7' fill='%23b06cf5'/></svg>"
)

SHELL = """<!doctype html>
<html lang="en" data-flavor="milk" data-subject="{slug}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>{title} — James Richmond</title>
<meta name="description" content="{description}">

<meta property="og:title" content="{title} — James Richmond">
<meta property="og:description" content="{description}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://jamestrichmond.com/{slug}/">

<link rel="icon" href="{favicon}">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@10..48,400;10..48,600;10..48,800&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="../assets/css/site.css">
<link rel="stylesheet" href="../assets/css/subject.css">

<script>
/* Set the saved flavor before first paint so there is no flash of the wrong chocolate. */
{{
  const flavor = localStorage.getItem("flavor") || "milk";
  document.documentElement.dataset.flavor = flavor;
  document.querySelector('meta[name="color-scheme"]').content = flavor === "white" ? "light" : "dark";
}}
</script>
</head>

<body>
<div class="hypershapes" aria-hidden="true" data-hypershapes></div>

<a class="skip" href="#main">Skip to content</a>

<header class="topbar">
  <a class="mark" href="../">
    <span class="mark-glyph" aria-hidden="true"></span>
    <span class="mark-text">James Richmond</span>
  </a>

  <nav class="topnav" aria-label="Primary">
    <a class="backlink" href="../">back</a>
  </nav>

  <fieldset class="flavors" data-flavors>
    <legend class="sr-only">Chocolate flavor</legend>
    <label class="flavor" title="Dark chocolate">
      <input type="radio" name="flavor" value="dark">
      <span class="swatch swatch-dark" aria-hidden="true"></span>
      <span class="sr-only">Dark chocolate</span>
    </label>
    <label class="flavor" title="Milk chocolate">
      <input type="radio" name="flavor" value="milk">
      <span class="swatch swatch-milk" aria-hidden="true"></span>
      <span class="sr-only">Milk chocolate</span>
    </label>
    <label class="flavor" title="White chocolate">
      <input type="radio" name="flavor" value="white">
      <span class="swatch swatch-white" aria-hidden="true"></span>
      <span class="sr-only">White chocolate</span>
    </label>
  </fieldset>
</header>

<main id="main">

  <section class="subject-hero">
    <p class="subject-eyebrow">{eyebrow}</p>
    <h1 class="subject-title">{headline}</h1>
    <p class="subject-lede">{lede}</p>
  </section>

  <ul class="facts">
{facts}
  </ul>

{body}

  <section class="section">
    <div class="docent">
      <div class="docent-stage" data-docent></div>
      <p class="docent-cap">{docent_caption}</p>
    </div>
  </section>

{tail}

  <section class="section">
    <nav class="rooms" aria-label="Other pages">
{rooms}
    </nav>
  </section>

</main>

<footer class="foot">
  <p class="foot-line">
    <a href="../">Back to the front page</a>, where the robot has more to do.
  </p>
  <p class="foot-meta">
    <a href="https://github.com/JamesTRichmond">GitHub</a>
    <a href="https://www.linkedin.com/in/jamestrichmond">LinkedIn</a>
    <a href="mailto:jamestrichmond@gmail.com">Email</a>
  </p>
</footer>

<script type="module" src="../assets/js/subject.js"></script>
</body>
</html>
"""


def facts_html(items):
    out = []
    for n, label in items:
        out.append(
            f'    <li><span class="fact-n">{n}</span>'
            f'<span class="fact-l">{label}</span></li>'
        )
    return "\n".join(out)


def rooms_html(current):
    out = []
    for slug, label in ROOMS:
        cur = ' aria-current="page"' if slug == current else ""
        out.append(f'      <a class="room" href="../{slug}/"{cur}>{label}</a>')
    return "\n".join(out)


def exhibit(name, heading, note, lead_h2=None, lead_sub=None):
    lead = ""
    if lead_h2:
        lead = f"""    <div class="section-head" style="inline-size: var(--shell); margin-inline: auto;">
      <h2>{lead_h2}</h2>
      <p class="section-sub">{lead_sub}</p>
    </div>

"""
    return f"""  <section class="section">
{lead}    <div class="exhibit" data-exhibit="{name}">
      <div class="exhibit-head">
        <h3>{heading}</h3>
        <p class="exhibit-note">{note}</p>
      </div>
    </div>
  </section>
"""


def prose(*paras):
    return '  <section class="section">\n    <div class="prose">\n' + \
        "\n".join(f"      {p}" for p in paras) + \
        "\n    </div>\n  </section>\n"


def sources(items, footnote=""):
    lis = "\n".join(
        f'        <li><a href="{url}">{name}</a>{" — " + why if why else ""}</li>'
        for name, url, why in items
    )
    fn = (
        f'      <p style="margin-block-start:1.2rem;color:var(--ink-dim)">{footnote}</p>\n'
        if footnote else ""
    )
    return f"""  <section class="section">
    <div class="sources">
      <h3>Where this comes from</h3>
      <ol>
{lis}
      </ol>
{fn}    </div>
  </section>
"""


PAGES = {}

# ─────────────────────────────────────────────────────────── teacher ────────
PAGES["teacher"] = dict(
    title="Teacher",
    description=(
        "Eight years teaching, most of it AP US History. What a document-based "
        "question actually teaches, and why it turns out to be the same skill as "
        "reading a stack trace."
    ),
    eyebrow="Eight years · AP US History",
    headline="I taught people to argue with a document.",
    lede=(
        "Not to memorise it. To read a primary source, work out what it will and "
        "will not support, and then say so in writing under time pressure. It is "
        "the most transferable thing I know how to teach."
    ),
    facts=[
        ("8 years", "In the classroom, Florida and then Vermont"),
        ("AP USH", "The course that is really a writing course wearing a history costume"),
        ("7 points", "What a DBQ is worth, and none of them are for knowing the date"),
        ("55 min", "To read seven documents and build an argument out of them"),
    ],
    docent_caption=(
        "He runs the room the way I did: ask, wait through the silence, "
        "and do not answer your own question."
    ),
    body=exhibit(
        "dbq",
        "A document-based question, in miniature",
        "Read the source. Pick the claim it actually supports.",
        lead_h2="The exercise",
        lead_sub=(
            "This is the whole discipline, compressed. Four claims, one source, and "
            "only one of them is a thing the document can carry."
        ),
    ) + prose(
        "<h3>What the exercise is really doing</h3>",
        "<p>Every one of those wrong answers is wrong in a specific, teachable way. "
        "One is true but not <em>in the document</em>. One overreaches — the source "
        "supports a smaller version of it. One reverses cause and effect. And one is "
        "the trap: it is what the student already believed walking in, and the "
        "document has nothing to do with it.</p>",
        "<p>Students hate this at first, because it takes away the thing school has "
        "trained them to do, which is to find the right answer. There is no right "
        "answer here in that sense. There is a claim, and there is the question of "
        "whether this particular piece of evidence gets you there. That is it. That "
        "is the whole course.</p>",
        "<blockquote class=\"pull\">The first month is spent convincing thirty "
        "sixteen-year-olds that I am not withholding the answer. I am not. The answer "
        "is the argument, and they have to build it."
        "<cite>Every September, for eight years</cite></blockquote>",
        "<h3>Why this is on a page about software</h3>",
        "<p>Because it is debugging. A stack trace is a primary source. It was "
        "produced by a particular process at a particular moment, for its own "
        "purposes, and it will support some conclusions and not others. The failure "
        "mode is identical too: the junior engineer and the sophomore both reach "
        "past what the evidence says toward the story they already had in mind.</p>",
        "<p>The same move shows up everywhere I work now. An eval result is a "
        "document. A log line is a document. A model's chain of reasoning is very "
        "much a document, and treating it as a transparent window onto what actually "
        "happened is exactly the mistake I spent eight years talking people out of.</p>",
        "<h3>The part nobody warns you about</h3>",
        "<p>Teaching is a performance job, five times a day, whether or not you have "
        "anything left. You learn to read a room in about four seconds — who is lost, "
        "who is bored, who is about to say something good and needs half a second of "
        "silence to do it. I use that in every meeting I have ever been in since, and "
        "it is worth more than most of what is on my résumé.</p>",
        "<p>I also learned that if thirty people did not understand you, you were "
        "unclear. Not them. That one took a while.</p>",
    ),
    tail=prose(
        "<h3>What I'd tell a new teacher</h3>",
        "<ul>"
        "<li>Plan the first five minutes and the last five minutes. The middle will "
        "look after itself more often than you think.</li>"
        "<li>Wait longer than is comfortable after you ask something. The silence is "
        "not failure; it is the sound of people thinking. Fill it and you have taught "
        "them that you will always fill it.</li>"
        "<li>Grade the argument, not the conclusion. Say so out loud, repeatedly, "
        "until they believe you.</li>"
        "<li>The kid who fights you about the reading is engaged. The kid who agrees "
        "with everything is the one to worry about.</li>"
        "</ul>",
    ),
)

# ──────────────────────────────────────────────────────────── agents ────────
PAGES["agents"] = dict(
    title="AI Agents",
    description=(
        "What an agent actually is underneath the word: a loop, a set of tools, and "
        "a decision about when to stop. Step through one."
    ),
    eyebrow="AI · Agents",
    headline="An agent is a loop with a budget.",
    lede=(
        "Strip the word back and what is left is small: a model that can call "
        "functions, a transcript that grows, and a stopping rule. Everything "
        "difficult is in the third one."
    ),
    facts=[
        ("1", "Loop. Think, act, observe, decide again"),
        ("N", "Tools, each of which can fail in its own way"),
        ("Stop", "The hardest thing to get right, and the least discussed"),
        ("Every step", "Is a place a wrong turn compounds"),
    ],
    docent_caption=(
        "Call a tool, read what came back, decide again. He is doing the "
        "whole architecture with his hands."
    ),
    body=exhibit(
        "agentloop",
        "One loop, stepped by hand",
        "Press step. Watch where it can go wrong.",
        lead_h2="The loop",
        lead_sub=(
            "A real task, run one turn at a time, with the transcript on the right. "
            "The interesting part is turn four."
        ),
    ) + prose(
        "<h3>Why the stopping rule is the whole problem</h3>",
        "<p>A model that can call tools will keep calling tools. It has no native "
        "sense of enough. Left alone it will re-read the file it already read, verify "
        "the thing it already verified, and produce a report about a task it never "
        "finished — all of it fluent, all of it confident, and none of it done.</p>",
        "<p>So the engineering is mostly fences. A step budget. A rule that a tool "
        "returning the same result twice is a signal, not a coincidence. A definition "
        "of done that lives outside the model, because a model asked whether it is "
        "finished will tell you yes.</p>",
        "<h3>The failure that taught me the most</h3>",
        "<p>An agent I built kept succeeding on a task it had not done. It would call "
        "the search tool, get an empty result, and then — because empty is not an "
        "error — write a confident summary of nothing. The tool was working "
        "perfectly. The loop was working perfectly. The failure lived in the gap "
        "between them, in an unexamined assumption that a successful call returns "
        "something worth having.</p>",
        "<p>This is the two-person rule again, and the reason I keep coming back to "
        "it. A step nobody checks is a step that will eventually be wrong, and the "
        "checker cannot be the same thing that took the step.</p>",
        "<h3>What I actually build</h3>",
        "<ul>"
        "<li><strong>Tools with narrow contracts.</strong> A tool that can do six "
        "things fails in six ways and reports one. Six tools fail legibly.</li>"
        "<li><strong>Empty is a result, not a success.</strong> Every tool "
        "distinguishes 'ran and found nothing' from 'ran and found something', out "
        "loud, in the value it returns.</li>"
        "<li><strong>The transcript is the artifact.</strong> If I cannot reconstruct "
        "why it did what it did from what it wrote down, I have built something I "
        "cannot debug and therefore cannot trust.</li>"
        "<li><strong>Budgets before cleverness.</strong> A hard step cap turns an "
        "unbounded failure into a bounded one, and a bounded failure is an "
        "engineering problem.</li>"
        "</ul>",
        "<p>The robot on the front page of this site is the toy version of the same "
        "idea: a state machine, a set of things it can do, and a rule about when to "
        "stop doing one and start another. It is genuinely the same shape. It is just "
        "that when he gets the stopping rule wrong he lies down in a kitchen, and "
        "nothing else happens.</p>",
    ),
    tail="",
)

# ────────────────────────────────────────────────────────── security ────────
PAGES["security"] = dict(
    title="Security",
    description=(
        "A threat model of this website, including the bot that lets strangers write "
        "on my GitHub profile. Type something hostile into it and watch what happens."
    ),
    eyebrow="M.S. IT & Cybersecurity · Digital Forensics",
    headline="I let strangers write on my GitHub profile.",
    lede=(
        "There is a bot on my profile repo that takes an issue from anybody on the "
        "internet and prints it into my README. That is an appalling idea, and it "
        "works. Here is exactly why."
    ),
    facts=[
        ("M.S.", "IT &amp; Cybersecurity, with certificates in digital forensics and AI"),
        ("13", "Adversarial cases the guestbook sanitizer has to survive"),
        ("0", "Untrusted values that reach a shell, ever"),
        ("Allow-list", "Not a block-list. The difference is the whole discipline"),
    ],
    docent_caption="Somebody's production, two in the morning.",
    body=exhibit(
        "sanitizer",
        "The guestbook sanitizer, running here in your browser",
        "Type something hostile. It is the real function.",
        lead_h2="Attack it",
        lead_sub=(
            "This is a JavaScript port of the Python that actually runs in the "
            "workflow, with the same rules in the same order. Try to get something "
            "through it."
        ),
    ) + prose(
        "<h3>The threat model</h3>",
        "<p>The guestbook takes a title and a body from a GitHub issue opened by "
        "anyone, and writes them into a Markdown file in my repository, which then "
        "renders on my profile. Every part of that sentence is an attack surface.</p>",
        "<ul>"
        "<li><strong>Markdown injection.</strong> A visitor writes "
        "<code>[click me](javascript:…)</code> or an image tag pointed at a tracking "
        "pixel, and now my profile is hosting it.</li>"
        "<li><strong>Layout destruction.</strong> A newline, a table pipe, or a "
        "hundred-line entry, and the README stops being a README.</li>"
        "<li><strong>Impersonation.</strong> A body that includes "
        "<code>— @someoneelse</code> and reads as a signature from a person who never "
        "signed.</li>"
        "<li><strong>Command injection into the workflow.</strong> The one that "
        "actually matters. If untrusted text ever reaches a shell inside a GitHub "
        "Action, the attacker is running code with my token.</li>"
        "</ul>",
        "<h3>How it is stopped</h3>",
        "<p>Allow-list, not block-list. The sanitizer does not try to enumerate bad "
        "input, because that is a race you lose. It defines the small set of "
        "characters a guestbook signature is allowed to contain — letters, digits, "
        "spaces, and a handful of punctuation marks — and discards everything else "
        "without opinion. There is no clever escaping, because escaping is where "
        "clever people put their bugs.</p>",
        "<p>The username is matched against GitHub's own rule for what a username can "
        "be, so it cannot be anything else. The body is truncated to its first line "
        "and capped, so it cannot restructure the page. The whole file is capped at "
        "twenty-five entries, so it cannot grow without bound.</p>",
        "<blockquote class=\"pull\">Untrusted input never appears in a shell command "
        "in the workflow. It is passed through the environment and read by the script "
        "as a variable. That single rule closes the only vulnerability on this list "
        "that would have actually cost me something."
        "<cite>The reason the workflow looks the way it does</cite></blockquote>",
        "<h3>Where the habits came from</h3>",
        "<p>The graduate work is the credential. The instinct is older than that, and "
        "it came from a job where the two-person rule was not a policy document — it "
        "was how every single task was performed, without exception, for people who "
        "had done it four hundred times. <a href=\"../usaf/\">That page is here.</a></p>",
        "<p>The habit it leaves you with is a specific kind of pessimism: assume the "
        "step will be performed wrong, and design so that being wrong is survivable. "
        "Not <em>detected</em> — survivable. Detection is a nice second place.</p>",
    ),
    tail=sources(
        [
            ("The sanitizer itself", "https://github.com/JamesTRichmond/JamesTRichmond/blob/main/scripts/sign_guestbook.py",
             "the Python this exhibit is a faithful port of"),
            ("The workflow that runs it", "https://github.com/JamesTRichmond/JamesTRichmond/blob/main/.github/workflows/guestbook.yml",
             "note that untrusted input is passed by environment, never interpolated into a shell"),
            ("GitHub: security hardening for Actions", "https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions",
             "why script injection in workflows is the vulnerability worth caring about"),
        ],
        "If you find something this misses, the guestbook is right there. "
        "Opening an issue is both the attack surface and the disclosure channel, "
        "which I find funny and have decided to keep.",
    ),
)

# ──────────────────────────────────────────────────────────── python ────────
PAGES["python"] = dict(
    title="Python",
    description=(
        "Python that runs in this page, on a real CPython compiled to WebAssembly. "
        "Edit it. Break it. Nothing here is a screenshot."
    ),
    eyebrow="Python",
    headline="This page runs Python. Actual Python.",
    lede=(
        "Not highlighted, not simulated, not a video. A real CPython interpreter "
        "compiled to WebAssembly, downloaded only if you ask for it, running in the "
        "tab you are reading this in."
    ),
    facts=[
        ("CPython", "The real one, compiled to WebAssembly via Pyodide"),
        ("0 bytes", "Downloaded until you press run — it is a big thing to load unasked"),
        ("Your tab", "Where it executes. Nothing is sent anywhere"),
        ("Editable", "Change the code and run it again. Break it, ideally"),
    ],
    docent_caption=(
        "The pause is him thinking. It is the most accurate part of this animation."
    ),
    body=exhibit(
        "pyrun",
        "A Python interpreter, in this page",
        "About 10 MB on first run, then cached.",
        lead_h2="Run it",
        lead_sub=(
            "The program is short on purpose — it is the sort of thing I actually "
            "write, not a fizzbuzz."
        ),
    ) + prose(
        "<h3>Why Python, specifically</h3>",
        "<p>Because it is the language I reach for when the problem is not yet "
        "understood. It gets out of the way while I find out what I am building, and "
        "that is a real property, not a compromise. Almost everything I have written "
        "in the last two years started as a Python script that was supposed to be "
        "thrown away.</p>",
        "<p>Some of them were. The ones that were not got types, tests, and a "
        "structure, and that transition — from script to thing — is where most of the "
        "interesting engineering decisions live.</p>",
        "<h3>What I actually use it for</h3>",
        "<ul>"
        "<li><strong>Agent tooling.</strong> The tools an agent calls are almost "
        "always Python functions with narrow contracts and boring, legible failures.</li>"
        "<li><strong>Data wrangling that has to be right.</strong> The kind where the "
        "answer matters and nobody will notice if it is subtly wrong, which means the "
        "test comes first.</li>"
        "<li><strong>Automation that outlives its author's memory.</strong> The "
        "sanitizer on <a href=\"../security/\">the security page</a> is Python, and it "
        "runs unattended every time a stranger opens an issue on my profile.</li>"
        "</ul>",
        "<h3>The opinion I will defend</h3>",
        "<p>Type hints are not about the type checker. They are about the reader — "
        "usually me, later, with no memory of what this function was for. A signature "
        "that says what goes in and what comes out is documentation that cannot rot, "
        "because the moment it lies, something complains.</p>",
        "<p>The corollary is that a function with a signature you cannot write down "
        "cleanly is usually a function doing two jobs. The type hint is not the "
        "problem there. It is the messenger.</p>",
    ),
    tail="",
)

# ──────────────────────────────────────────────────────── typescript ────────
PAGES["typescript"] = dict(
    title="TypeScript",
    description=(
        "TypeScript's type system is a programming language of its own. Edit a route "
        "string and watch the type it produces change, character by character."
    ),
    eyebrow="TypeScript",
    headline="The type system is a language too.",
    lede=(
        "Most people meet TypeScript as annotations on JavaScript. It is also a "
        "small, strange, pure functional language that runs at compile time — and "
        "you can make it read a string and hand you back a shape."
    ),
    facts=[
        ("Compile time", "Where the second language runs. It costs nothing at runtime"),
        ("Template literals", "The feature that turned types into string processing"),
        ("Zero", "Runtime code produced by anything in the exhibit below"),
        ("Live", "Edit the route. The inferred type follows you"),
    ],
    docent_caption=(
        "Green bar. Then he changes something, and it is not a green bar."
    ),
    body=exhibit(
        "tsinfer",
        "Type-level route parsing",
        "Edit the route. The type on the right is what TypeScript would infer.",
        lead_h2="Watch it think",
        lead_sub=(
            "One recursive conditional type reads a URL pattern and produces an object "
            "type of its parameters. Nothing here exists at runtime."
        ),
    ) + prose(
        "<h3>What just happened</h3>",
        "<p>The type on the right was not written by anyone. It was computed, by the "
        "compiler, from a string literal — and the moment you change a character of "
        "that string, every call site that uses it is re-checked against the new "
        "shape. Rename <code>:id</code> to <code>:userId</code> and the code that "
        "reads <code>params.id</code> stops compiling, everywhere, instantly.</p>",
        "<p>That is the actual pitch for TypeScript, and it is much better than the "
        "one people usually give. It is not that types catch typos. It is that a "
        "single source of truth can be a <em>string</em>, and everything downstream "
        "of it stays honest by construction.</p>",
        "<h3>When I stop</h3>",
        "<p>Type-level programming has the same failure mode as any clever technique: "
        "it is enormous fun and it is very easy to leave behind something only you can "
        "maintain. My rule is that a type should be more legible than the bug it "
        "prevents. When a conditional type needs a paragraph of comment to explain "
        "itself, the paragraph is telling me to write a runtime check and go home.</p>",
        "<blockquote class=\"pull\">A type that takes ten minutes to read has "
        "cost more than the bug it was guarding against. I have written that type. I "
        "have also deleted it."
        "<cite>Learned the expensive way</cite></blockquote>",
        "<h3>Where I actually use it</h3>",
        "<ul>"
        "<li><strong>Tool schemas for agents.</strong> A tool's arguments are a type, "
        "the JSON schema is generated from that type, and the handler is checked "
        "against it. One definition, three consumers, no drift.</li>"
        "<li><strong>Anything crossing a boundary.</strong> The network, the "
        "filesystem, another team. That is where the assumptions are, and where "
        "writing them down pays for itself.</li>"
        "<li><strong>The robot on the front page.</strong> Which is plain JavaScript "
        "with JSDoc, because it has no build step and I wanted it to have none. "
        "Knowing when not to reach for the tool is part of the tool.</li>"
        "</ul>",
    ),
    tail="",
)


def build():
    written = []
    for slug, page in PAGES.items():
        html = SHELL.format(
            slug=slug,
            favicon=FAVICON,
            title=page["title"],
            description=page["description"],
            eyebrow=page["eyebrow"],
            headline=page["headline"],
            lede=page["lede"],
            facts=facts_html(page["facts"]),
            body=page["body"],
            docent_caption=page["docent_caption"],
            tail=page["tail"],
            rooms=rooms_html(slug),
        )
        out = ROOT / slug / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding="utf-8")
        written.append(str(out.relative_to(ROOT)))
    return written


if __name__ == "__main__":
    for path in build():
        print("wrote", path)
    sys.exit(0)
