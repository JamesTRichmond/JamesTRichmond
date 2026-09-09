/* ============================================================================
   site.js — wiring. Flavor switching, the live activity feed, and the single
   animation loop that everything else hangs off.
   ========================================================================== */

import { mountHypershapes } from "./hypershapes.js";
import { mountPet } from "./pet.js";

/* ── Flavors ───────────────────────────────────────────────────────────── */

function initFlavors() {
  const root = document.documentElement;
  const fieldset = document.querySelector("[data-flavors]");
  if (!fieldset) return;

  const sync = () => {
    const current = root.dataset.flavor;
    for (const input of fieldset.querySelectorAll("input")) {
      input.checked = input.value === current;
    }
    document.querySelector('meta[name="color-scheme"]').content =
      current === "white" ? "light" : "dark";
  };
  sync();

  fieldset.addEventListener("change", (e) => {
    const flavor = e.target.value;
    const apply = () => {
      root.dataset.flavor = flavor;
      localStorage.setItem("flavor", flavor);
      sync();
    };
    // Morph rather than snap, where the browser can.
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  });
}

/* ── Live activity feed ────────────────────────────────────────────────── */

const FEED_URL = "https://api.github.com/users/JamesTRichmond/events/public?per_page=30";
const FEED_TTL = 20 * 60 * 1000;

const VERBS = {
  PushEvent: "pushed",
  PullRequestEvent: "pull request",
  IssuesEvent: "issue",
  CreateEvent: "created",
  WatchEvent: "starred",
  ForkEvent: "forked",
  ReleaseEvent: "released",
  IssueCommentEvent: "commented",
  PullRequestReviewEvent: "reviewed",
  DeleteEvent: "deleted",
  PublicEvent: "open sourced",
};

function ago(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  if (s < 2592000) return `${Math.round(s / 86400)}d`;
  return `${Math.round(s / 2592000)}mo`;
}

function describe(ev) {
  const verb = VERBS[ev.type] || ev.type.replace(/Event$/, "").toLowerCase();
  let detail = ev.repo?.name ?? "";
  if (ev.type === "PushEvent") {
    // The public events feed often omits the commit payload entirely, so
    // claiming a count means claiming "0". Name the repo and leave it there.
    const n = ev.payload?.size ?? ev.payload?.commits?.length;
    detail = n ? `${n} commit${n === 1 ? "" : "s"} to ${detail}` : `to ${detail}`;
  } else if (ev.type === "PullRequestEvent") {
    detail = `${ev.payload?.action ?? ""} #${ev.payload?.number ?? ""} in ${detail}`;
  } else if (ev.type === "IssuesEvent") {
    detail = `${ev.payload?.action ?? ""} #${ev.payload?.issue?.number ?? ""} in ${detail}`;
  } else if (ev.type === "CreateEvent") {
    detail = `${ev.payload?.ref_type ?? ""} in ${detail}`;
  }
  return { verb, detail, repo: ev.repo?.name, at: ev.created_at };
}

async function initFeed() {
  const list = document.querySelector("[data-feed]");
  if (!list) return;

  let events = null;
  try {
    const cached = JSON.parse(localStorage.getItem("feed") || "null");
    if (cached && Date.now() - cached.at < FEED_TTL) events = cached.events;
  } catch { /* corrupt cache is not worth caring about */ }

  if (!events) {
    try {
      const res = await fetch(FEED_URL, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) throw new Error(res.status);
      events = await res.json();
      localStorage.setItem("feed", JSON.stringify({ at: Date.now(), events: events.slice(0, 12) }));
    } catch {
      list.innerHTML =
        `<li class="feed-empty">GitHub's API is rate-limiting this page. ` +
        `<a href="https://github.com/JamesTRichmond?tab=overview">See it on GitHub instead.</a></li>`;
      return;
    }
  }

  // A burst of pushes to one repo is one thing that happened, not eight.
  const rows = [];
  for (const row of events.map(describe)) {
    const last = rows.at(-1);
    if (last && last.verb === row.verb && last.repo === row.repo) continue;
    rows.push(row);
    if (rows.length === 8) break;
  }
  if (!rows.length) {
    list.innerHTML = `<li class="feed-empty">Quiet week.</li>`;
    return;
  }

  list.replaceChildren(...rows.map((r) => {
    const li = document.createElement("li");
    const verb = document.createElement("span");
    verb.className = "verb";
    verb.textContent = r.verb;
    const body = document.createElement("span");
    if (r.repo) {
      const a = document.createElement("a");
      a.href = `https://github.com/${r.repo}`;
      a.textContent = r.detail;
      body.append(a);
    } else {
      body.textContent = r.detail;
    }
    const when = document.createElement("span");
    when.className = "when";
    when.textContent = ago(r.at);
    li.append(verb, body, when);
    return li;
  }));
}

/* ── Boot ──────────────────────────────────────────────────────────────── */

function boot() {
  initFlavors();
  initFeed();

  const shapes = mountHypershapes(document.querySelector("[data-hypershapes]"));
  shapes.prime();

  const stage = document.querySelector("[data-stage]");
  if (!stage) return;

  const acts = [...document.querySelectorAll(".act")];
  const pet = mountPet(stage, {
    onStateChange(name) {
      for (const b of acts) {
        b.setAttribute("aria-pressed", String(b.dataset.act === name));
      }
    },
  });

  for (const btn of acts) {
    btn.addEventListener("click", () => pet.command(btn.dataset.act));
  }

  /* One loop for the whole page. It stops when the tab is hidden and when the
     habitat scrolls out of view, so an idle tab costs nothing. */
  let visible = true;
  new IntersectionObserver(
    ([entry]) => { visible = entry.isIntersecting; if (visible) last = performance.now(); },
    { rootMargin: "120px" }
  ).observe(stage);

  let last = performance.now();
  let raf = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    // Clamp so a backgrounded tab or a slow frame can't teleport him.
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    shapes.update(dt);
    if (visible) pet.update(dt);
  }

  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  start();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
