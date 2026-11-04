import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// Source-driven tests with minimal DOM doubles. No browser or network is used.
const root = process.env.PORTFOLIO_ROOT
  ? resolve(process.env.PORTFOLIO_ROOT)
  : fileURLToPath(new URL('../', import.meta.url));
const chrome = await readFile(resolve(root, 'assets/js/chrome.js'), 'utf8');
const site = await readFile(resolve(root, 'assets/js/site.js'), 'utf8');
const home = await readFile(resolve(root, 'index.html'), 'utf8');

function chromeEnvironment({ reduced = true, transition = false } = {}) {
  const inputs = ['dark', 'milk', 'white'].map(value => ({ value, checked: false }));
  const rootElement = { dataset: { flavor: 'milk' } };
  const meta = { content: 'dark' };
  let change;
  let transitions = 0;
  const fieldset = {
    hidden: true,
    querySelectorAll() { return inputs; },
    addEventListener(type, listener) { assert.equal(type, 'change'); change = listener; },
  };
  const document = {
    documentElement: rootElement,
    querySelector(selector) { return selector === '[data-flavors]' ? fieldset : meta; },
  };
  if (transition) document.startViewTransition = apply => { transitions++; apply(); };
  const context = vm.createContext({ document,
    localStorage: { setItem() { throw new Error('Storage denied'); } },
    matchMedia: () => ({ matches: reduced }),
  });
  // chrome.js has no imports. Strip only its ESM export modifiers for vm.Script.
  new vm.Script(chrome.replace(/^export /gm, '')).runInContext(context);
  context.initFlavors();
  return { inputs, rootElement, meta, fieldset, change: value => change({ target: { value } }),
    transitions: () => transitions };
}

test('theme change synchronizes palette, radio selection and color-scheme when persistence is denied', () => {
  const env = chromeEnvironment();
  assert.equal(env.fieldset.hidden, false, 'installed controls should be revealed');
  assert.equal(env.inputs.find(input => input.checked).value, 'milk');
  assert.doesNotThrow(() => env.change('white'));
  assert.equal(env.rootElement.dataset.flavor, 'white');
  assert.equal(env.meta.content, 'light');
  assert.equal(env.inputs.filter(input => input.checked).length, 1);
  assert.equal(env.inputs.find(input => input.checked).value, 'white');
});

test('theme persistence failure does not break a supported view-transition callback', () => {
  const env = chromeEnvironment({ reduced: false, transition: true });
  assert.doesNotThrow(() => env.change('dark'));
  assert.equal(env.transitions(), 1);
  assert.equal(env.rootElement.dataset.flavor, 'dark');
  assert.equal(env.meta.content, 'dark');
  assert.equal(env.inputs.find(input => input.checked).value, 'dark');
});

test('homepage prepaint falls back safely for denied or invalid stored preferences', () => {
  const script = home.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, 'homepage must contain its preference prepaint script');
  for (const storage of [
    { getItem() { throw new Error('Storage denied'); } },
    { getItem: () => 'not-a-flavor' },
    { getItem: () => null },
  ]) {
    const documentElement = { dataset: {} };
    const meta = {};
    const context = vm.createContext({ localStorage: storage,
      document: { documentElement, querySelector: () => meta } });
    assert.doesNotThrow(() => new vm.Script(script).runInContext(context));
    assert.equal(documentElement.dataset.flavor, 'milk');
    assert.equal(meta.content, 'dark');
  }
  const documentElement = { dataset: {} };
  const meta = {};
  new vm.Script(script).runInNewContext({ localStorage: { getItem: () => 'white' },
    document: { documentElement, querySelector: () => meta } });
  assert.equal(documentElement.dataset.flavor, 'white');
  assert.equal(meta.content, 'light');
});

function siteEnvironment({ storage, events = [], responseOk = true, portrait = false } = {}) {
  const list = { children: [], innerHTML: '', replaceChildren(...children) { this.children = children; } };
  const element = tag => ({ tag, children: [], append(...children) { this.children.push(...children); } });
  let fetches = 0;
  let shapeMounts = 0;
  let portraitReplacement;
  const caption = { textContent: 'Animated engraving' };
  const canvas = {
    closest: () => ({ querySelector: () => caption }),
    replaceWith(image) { portraitReplacement = image; },
  };
  const context = vm.createContext({
    console: { warn() {} }, Date, URL, performance: { now: () => 0 },
    Image: class { set src(value) { queueMicrotask(() => this.onerror?.()); } },
    localStorage: storage || { getItem: () => null, setItem() {} },
    fetch: async () => { fetches++; return { ok: responseOk, status: 503, json: async () => events }; },
    document: { readyState: 'loading', addEventListener() {},
      querySelector: selector => selector === '[data-feed]' ? list
        : selector === '[data-thor]' && portrait ? canvas : null,
      createElement: element },
    initFlavors() {}, mountHypershapes() { shapeMounts++; throw new Error('Unexpected absent-host mount'); },
  });
  // Keep production implementations intact while replacing ESM import bindings
  // with the explicit doubles above. DOMContentLoaded is deliberately not fired.
  const source = site.replace(/^import .*;\s*$/gm, '')
    .replace(/\bimport\.meta\.url\b/g, JSON.stringify('https://portfolio.test/assets/js/site.js'));
  new vm.Script(source + '\n;globalThis.portfolio = { initFeed, initPortrait, boot };').runInContext(context);
  return { context, list, fetches: () => fetches, shapeMounts: () => shapeMounts,
    portraitReplacement: () => portraitReplacement, caption };
}

const oneEvent = [{ type: 'PushEvent', repo: { name: 'JamesTRichmond/JamesTRichmond' },
  payload: {}, created_at: new Date().toISOString() }];

test('a successful activity response renders even when both cache access and persistence are denied', async () => {
  const env = siteEnvironment({ events: oneEvent, storage: {
    getItem() { throw new Error('Storage denied'); }, setItem() { throw new Error('Storage denied'); },
  } });
  await env.context.portfolio.initFeed();
  assert.equal(env.fetches(), 1);
  assert.equal(env.list.children.length, 1);
  assert.equal(env.list.children[0].children[1].children[0].href,
    'https://github.com/JamesTRichmond/JamesTRichmond');
  assert.equal(env.list.innerHTML, '');
});

test('unavailable activity service leaves a usable GitHub fallback', async () => {
  const env = siteEnvironment({ responseOk: false });
  await env.context.portfolio.initFeed();
  assert.equal(env.list.children.length, 0);
  assert.match(env.list.innerHTML, /https:\/\/github.com\/JamesTRichmond\?tab=overview/);
});

test('malformed cached activity is replaced with a fresh response', async () => {
  const env = siteEnvironment({ events: oneEvent, storage: {
    getItem: () => JSON.stringify({ at: Date.now(), events: {} }), setItem() {},
  } });
  await env.context.portfolio.initFeed();
  assert.equal(env.fetches(), 1);
  assert.equal(env.list.children.length, 1);
});

test('homepage boot tolerates the intentionally absent hypershapes host', async () => {
  const env = siteEnvironment();
  assert.doesNotThrow(() => env.context.portfolio.boot());
  // initFeed runs asynchronously from boot; allow the mocked response to settle.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(env.shapeMounts(), 0);
  assert.match(env.list.innerHTML, /Quiet week/);
});

test('portrait enhancement failure retains an accessible original engraving', async () => {
  const env = siteEnvironment({ portrait: true });
  await env.context.portfolio.initPortrait();
  const still = env.portraitReplacement();
  assert.ok(still, 'the unavailable canvas should be replaced, not removed');
  assert.equal(still.tag, 'img');
  assert.equal(still.src, 'https://portfolio.test/assets/thor/plate.webp');
  assert.match(still.alt, /original.*Thor engraving/i);
  assert.ok(still.width > 0 && still.height > 0);
  assert.equal(still.loading, 'lazy');
  assert.match(env.caption.textContent, /supported browsers/);
});
