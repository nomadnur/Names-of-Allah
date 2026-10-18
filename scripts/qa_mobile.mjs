#!/usr/bin/env node
/**
 * qa_mobile.mjs — Mobile QA harness for the Names of Allah PWA.
 *
 * Drives the real UI with Playwright at phone widths, captures screenshots,
 * checks every view for horizontal overflow, and reports console errors.
 *
 * Usage:
 *   node scripts/qa_mobile.mjs <label> [--base http://localhost:8000] [--fullpage]
 *
 *   <label>  output folder name under .qa/ (e.g. "baseline" or "after")
 *
 * Requires the dev server running:  python3 -m http.server 8000  (from pwa/)
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Resolve playwright whether installed locally or globally (npm -g).
const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = [
    'playwright',
    '/Users/nurfurlong/.npm-global/lib/node_modules/playwright',
    '/usr/local/lib/node_modules/playwright',
    '/opt/homebrew/lib/node_modules/playwright',
  ];
  for (const c of candidates) {
    try {
      return require(c).chromium;
    } catch {
      /* try next */
    }
  }
  throw new Error('playwright not found — install with: npm i -g playwright');
}
const chromium = loadPlaywright();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PWA_ROOT = path.resolve(__dirname, '..');
const OUT_ROOT = path.join(PWA_ROOT, '.qa');

const args = process.argv.slice(2);
const label = args[0] || 'run';
const baseIdx = args.indexOf('--base');
const BASE = baseIdx !== -1 ? args[baseIdx + 1] : 'http://localhost:8000';
const FULLPAGE = args.includes('--fullpage');

// Viewport matrix: portrait phones + one landscape.
const VIEWPORTS = [
  { name: 'w320', width: 320, height: 568 },   // iPhone SE class
  { name: 'w360', width: 360, height: 740 },   // common Android
  { name: 'w390', width: 390, height: 844 },   // iPhone 14
  { name: 'w414', width: 414, height: 896 },   // iPhone 11 / XR
  { name: 'L844', width: 844, height: 390 },   // landscape
];

// Homepage variants live inside the welcome view.
const VARIANTS = ['v1', 'v2', 'v3', 'v4', 'baseline'];
// Standalone views reachable via nav links.
const VIEWS = ['browse', 'situations', 'videos', 'memorize', 'progress', 'favorites'];

const results = [];
const consoleErrors = [];

function overflowMetrics() {
  const doc = document.documentElement;
  const body = document.body;
  return {
    scrollWidth: Math.max(doc.scrollWidth, body ? body.scrollWidth : 0),
    clientWidth: doc.clientWidth,
    innerWidth: window.innerWidth,
    overflowing:
      Math.max(doc.scrollWidth, body ? body.scrollWidth : 0) >
      Math.max(doc.clientWidth, window.innerWidth) + 1,
  };
}

// Page-level scrollWidth can stay clean while an ancestor with
// overflow:hidden/clip silently truncates content (e.g. the v1 hero
// calligraphy). Flag elements that clip or scroll wider content.
function clippedContentProbe() {
  const bad = [];
  for (const el of document.querySelectorAll('body *')) {
    // visually-hidden labels and by-design ellipsis rows clip on purpose
    if (el.closest('.sr-only, .v1-mini-meaning, .v1-video-title')) continue;
    const cs = getComputedStyle(el);
    if (!['hidden', 'clip', 'auto', 'scroll'].includes(cs.overflowX)) continue;
    if (el.scrollWidth > el.clientWidth + 3) {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
        : '';
      bad.push(`${tag}${id}${cls} clips ${el.scrollWidth - el.clientWidth}px`);
      if (bad.length >= 8) break;
    }
  }
  return bad;
}

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(350); // fonts, view-enter animation
}

async function checkOverflow(page, context) {
  const m = await page.evaluate(overflowMetrics);
  const clips = await page.evaluate(clippedContentProbe);
  results.push({ ...context, ...m, clips });
  return m.overflowing || clips.length > 0;
}

async function shot(page, name) {
  const file = path.join(OUT_ROOT, label, `${name}.png`);
  await page.screenshot({ path: file, fullPage: FULLPAGE });
}

// Nav links sit inside the closed drawer — dispatch a real DOM click instead
// of a Playwright click (which requires the element to be visible).
async function gotoView(page, view) {
  await page.evaluate((v) => {
    document.querySelector(`.nav-link[data-view="${v}"], .home-option[data-view="${v}"]`)?.click();
  }, view);
  await page.waitForTimeout(350);
}

async function main() {
  fs.mkdirSync(path.join(OUT_ROOT, label), { recursive: true });
  // Use system Chrome when available (playwright cache build may not match).
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome' });
  } catch {
    browser = await chromium.launch();
  }

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      serviceWorkers: 'block', // never QA a stale service-worker cache
    });
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      // Harness artifact: blocking service workers makes registration throw
      // a scope TypeError — that is our setting, not an app bug.
      if (msg.text().includes("reading 'scope'")) return;
      consoleErrors.push({ vp: vp.name, text: msg.text() });
    });
    page.on('pageerror', (err) => consoleErrors.push({ vp: vp.name, text: `PAGEERROR: ${err.message}` }));

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await settle(page);

    // --- Homepage variants (welcome view) ---
    for (const variant of VARIANTS) {
      const tab = page.locator(`.iter-tab[data-iter="${variant}"]`);
      if (await tab.count()) {
        await tab.click();
        await page.waitForTimeout(250);
      }
      const over = await checkOverflow(page, { vp: vp.name, view: `home-${variant}` });
      // Full-page detail only at the two narrowest portrait widths; viewport shots elsewhere.
      if (vp.name === 'w320' || vp.name === 'w360') {
        await shot(page, `${vp.name}-home-${variant}`);
      }
      if (over) console.log(`  !! overflow ${vp.name} home-${variant} (${over})`);
    }

    // --- Other views ---
    for (const view of VIEWS) {
      await gotoView(page, view);
      const over = await checkOverflow(page, { vp: vp.name, view });
      if (vp.name === 'w360') await shot(page, `${vp.name}-${view}`);
      if (over) console.log(`  !! overflow ${vp.name} ${view}`);
    }

    // --- Sticky chrome check: does the header cover the studio bar after scroll? ---
    if (vp.name === 'w360' || vp.name === 'L844') {
      await page.evaluate(() => window.scrollTo(0, 600));
      await page.waitForTimeout(250);
      const sticky = await page.evaluate(() => {
        const bar = document.querySelector('.iter-studio-bar');
        const header = document.querySelector('.header');
        if (!bar || !header) return null;
        const b = bar.getBoundingClientRect();
        const h = header.getBoundingClientRect();
        return {
          bar: { top: b.top, bottom: b.bottom, height: b.height },
          header: { top: h.top, bottom: h.bottom, height: h.height },
          headerCoversBar: h.top < b.bottom - 1 && h.zIndexWon !== true,
        };
      });
      results.push({ vp: vp.name, view: 'sticky-check', ...sticky });
    }

    // --- Open states at w360 + landscape: name modal, video player, drawer ---
    if (vp.name === 'w360' || vp.name === 'L844') {
      // Name modal
      await gotoView(page, 'browse');
      const card = page.locator('.name-card').first();
      if (await card.count()) {
        await card.click();
        await page.waitForTimeout(400);
        await shot(page, `${vp.name}-modal-name`);
        await checkOverflow(page, { vp: vp.name, view: 'modal-name' });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(250);
      }
      // Video player
      await gotoView(page, 'videos');
      const videoRow = page.locator('.video-row').first();
      if (await videoRow.count()) {
        await videoRow.click();
        await page.waitForTimeout(600);
        await shot(page, `${vp.name}-video-player`);
        await checkOverflow(page, { vp: vp.name, view: 'video-player' });
        await page.keyboard.press('Escape');
        await page.locator('.video-player-close, .video-player .btn-close, [aria-label="Close video"]').first()
          .click({ force: true }).catch(() => {});
        await page.waitForTimeout(250);
      }
      // Nav drawer
      await gotoView(page, 'welcome');
      await page.locator('#menuToggle').click();
      await page.waitForTimeout(400);
      await shot(page, `${vp.name}-drawer`);
      await page.locator('#navClose').click().catch(() => {});
      await page.waitForTimeout(250);
    }

    await context.close();
  }

  await browser.close();

  // --- Report ---
  const overflowing = results.filter((r) => r.overflowing === true);
  const clipped = results.filter((r) => Array.isArray(r.clips) && r.clips.length > 0);
  const report = {
    label,
    base: BASE,
    generatedAt: new Date().toISOString(),
    viewportCount: VIEWPORTS.length,
    checked: results.filter((r) => r.overflowing !== undefined).length,
    overflowingViews: overflowing.map((r) => `${r.vp}/${r.view} (scroll ${r.scrollWidth} vs client ${Math.max(r.clientWidth, r.innerWidth)})`),
    clippedViews: clipped.map((r) => ({ vp: r.vp, view: r.view, clips: r.clips })),
    stickyChecks: results.filter((r) => r.view === 'sticky-check'),
    consoleErrors: consoleErrors.slice(0, 30),
  };
  fs.writeFileSync(path.join(OUT_ROOT, label, 'report.json'), JSON.stringify(report, null, 2));

  const lines = [
    `# Mobile QA — ${label}`,
    ``,
    `- Generated: ${report.generatedAt}`,
    `- Viewports: ${VIEWPORTS.map((v) => v.name).join(', ')}`,
    `- Views checked: ${report.checked}`,
    ``,
    `## Horizontal overflow (${overflowing.length})`,
    ...(overflowing.length
      ? overflowing.map((r) => `- **${r.vp} / ${r.view}** — scrollWidth ${r.scrollWidth} > viewport ${Math.max(r.clientWidth, r.innerWidth)}`)
      : ['- none']),
    ``,
    `## Clipped / internally scrolling content (${clipped.length})`,
    ...(clipped.length
      ? clipped.flatMap((r) => [`- **${r.vp} / ${r.view}**`, ...r.clips.map((c) => `  - ${c}`)])
      : ['- none']),
    ``,
    `## Sticky chrome checks`,
    ...report.stickyChecks.map(
      (s) => `- ${s.vp}: bar y ${Math.round(s.bar?.top ?? -999)}..${Math.round(s.bar?.bottom ?? -999)}, header y ${Math.round(s.header?.top ?? -999)}..${Math.round(s.header?.bottom ?? -999)}${s.headerCoversBar ? ' — **HEADER COVERS BAR**' : ''}`
    ),
    ``,
    `## Console errors (${consoleErrors.length})`,
    ...(consoleErrors.length ? consoleErrors.slice(0, 15).map((e) => `- [${e.vp}] ${e.text.slice(0, 200)}`) : ['- none']),
  ];
  fs.writeFileSync(path.join(OUT_ROOT, label, 'SUMMARY.md'), lines.join('\n') + '\n');

  console.log(`\nQA "${label}" complete: ${overflowing.length} overflowing, ${clipped.length} clipped views, ${consoleErrors.length} console errors.`);
  console.log(`Output: ${path.join(OUT_ROOT, label)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
