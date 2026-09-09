/* ============================================================================
   site.js — wiring. Flavor switching, the live activity feed, and the single
   animation loop that everything else hangs off.
   ========================================================================== */

import { mountHypershapes } from "./hypershapes.js";
import { mountPet } from "./pet.js";
// The flavor switcher lives in chrome.js because seven pages wear it, and
// seven copies of it is seven chances for one of them to drift.
import { initFlavors } from "./chrome.js";

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

/* The animated portrait. Loaded on its own, after the page is up: it is about
   900 KB of plate and masks, and nothing else on the page should wait on it.
   If WebGL2 is missing or the assets fail, the figure removes itself and the
   hero falls back to a single column — :has() in the stylesheet handles that
   without a second layout rule. */
async function initPortrait() {
  const canvas = document.querySelector("[data-thor]");
  if (!canvas) return;
  try {
    const load = (src) => new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error(src));
      i.src = src;
    });
    const [{ createThor }, plate, masks, grade] = await Promise.all([
      import("../thor/thor.js"),
      load("assets/thor/plate.webp"),
      load("assets/thor/masks.webp"),
      load("assets/thor/grade.webp"),
    ]);

    // Render at device resolution: a circle of hatching at 1x on a retina
    // screen turns into moiré.
    const dpr = Math.min(2, devicePixelRatio || 1);
    const css = canvas.getBoundingClientRect().width || 320;
    canvas.width = canvas.height = Math.round(css * dpr);

    const thor = createThor(canvas, {
      src: plate, mask: masks, grade,
      crop: [178, 8, 1318, 1148],   // the full figure, in the plate's own 1329x1600
      loop: 8, cycles: 2,
    });

    // Costs nothing while scrolled away or in a background tab.
    let onScreen = true;
    new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      onScreen && !document.hidden ? thor.start() : thor.stop();
    }, { rootMargin: "150px" }).observe(canvas);
    document.addEventListener("visibilitychange", () => {
      document.hidden || !onScreen ? thor.stop() : thor.start();
    });
    thor.start();
  } catch (err) {
    console.warn("portrait did not load:", err);
    canvas.closest("figure")?.remove();
  }
}

function boot() {
  initFlavors();
  initFeed();
  initPortrait();

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
