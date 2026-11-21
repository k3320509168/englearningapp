import { expect, test, type CDPSession } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { DEFAULT_CHARACTER } from '../src/game/character';

// Opt-in: E2E_PERF=1 E2E_BASE_URL=http://127.0.0.1:5184 npx playwright test e2e/performance.spec.ts
// Start a production Vite preview separately. Existing config may also start
// its own dev webServer, but this file deliberately navigates to the explicit preview URL.
const enabled = process.env.E2E_PERF === '1';
const base = new URL(process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5184');
const url = new URL('/englearningapp/', base).href;
const outputDir = 'docs/question-bank-qa/learning-20261122';
const profiles = [
  { name: 'desktop-local-unthrottled', width: 1366, height: 768, cpuRate: 1,
    latencyMs: 0, downloadBytesPerSecond: -1, uploadBytesPerSecond: -1 },
  { name: 'narrow-viewport-controlled-slow', width: 375, height: 812, cpuRate: 4,
    latencyMs: 100, downloadBytesPerSecond: 4_000_000 / 8, uploadBytesPerSecond: 1_000_000 / 8 },
] as const;
type Sample = { profile: typeof profiles[number]; metrics: Awaited<ReturnType<typeof readMetrics>>; browserVersion: string };
const samples: Sample[] = [];

async function readMetrics(page: import('@playwright/test').Page, adventureVisibleMs: number, caravanVisibleMs: number) {
  return page.evaluate(({ adventureVisibleMs, caravanVisibleMs }) => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const completed = performance.getEntriesByType('resource').filter(entry => entry.duration >= 0) as PerformanceResourceTiming[];
    return {
      // Locator visibility is sampled from the automation side, then timestamped in the page.
      // These are controlled end-to-end observation times, not exact first-render timestamps.
      adventureVisibleMs, caravanVisibleMs,
      adventureToCaravanMs: caravanVisibleMs - adventureVisibleMs,
      fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
      domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? null,
      loadEventEndMs: navigation?.loadEventEnd || null,
      snapshotAtMs: performance.now(),
      completedResourceCount: completed.length,
      completedResourceTransferBytes: completed.reduce((sum, e) => sum + e.transferSize, 0),
      navigationTransferBytes: navigation?.transferSize ?? 0,
      completedTransferBytesIncludingNavigation: completed.reduce((sum, e) => sum + e.transferSize, navigation?.transferSize ?? 0),
      completedEncodedBodyBytes: completed.reduce((sum, e) => sum + e.encodedBodySize, navigation?.encodedBodySize ?? 0),
      resources: completed.map(e => ({
        path: new URL(e.name).pathname, initiatorType: e.initiatorType,
        startTimeMs: e.startTime, durationMs: e.duration, transferBytes: e.transferSize,
        encodedBodyBytes: e.encodedBodySize, decodedBodyBytes: e.decodedBodySize,
      })),
    };
  }, { adventureVisibleMs, caravanVisibleMs });
}

test.describe('正式preview受控載入量測（opt-in）', () => {
  test.skip(!enabled, '需要 E2E_PERF=1，並先啟動5184正式preview。');
  test.describe.configure({ mode: 'serial', timeout: 120_000 });
  test.afterAll(async () => {
    if (!enabled || !samples.length) return;
    await mkdir(outputDir, { recursive: true });
    await writeFile(`${outputDir}/performance.json`, `${JSON.stringify({
      measuredAt: new Date().toISOString(), url, expectedSamples: profiles.length,
      allProfilesMeasured: samples.length === profiles.length,
      conditions: {
        environment: 'local Vite production preview; controlled synthetic measurement; compressed responses observed in encoded/decoded resource sizes',
        cache: 'Each case uses a new isolated browser context; CDP Network.setCacheDisabled=true; service workers blocked. No user profile or global cache is accessed or cleared.',
        timing: 'Browser navigation-relative performance.now() sampled immediately after locator visibility assertions; includes automation observation/click latency. FCP is the native paint entry.',
        resources: 'PerformanceResourceTiming entries completed by the caravan heading snapshot; preloads still in flight are excluded. transferSize includes protocol overhead and is not total final bundle size.',
        limitations: 'Not a real handset, mobile Safari, user network, deployed CDN, long-term benchmark, or CEFR/learning result. Narrow viewport uses desktop Chromium with CPU/network throttling. One sample per profile.',
        volume: 'Background music, sound effects and pronunciation volume all 0; autoSpeak=false.',
      }, samples,
    }, null, 2)}\n`, 'utf8');
  });
  for (const profile of profiles) {
    test(`${profile.name} ${profile.width}x${profile.height}`, async ({ browser, browserName }) => {
      test.skip(browserName !== 'chromium', 'This controlled benchmark requires Chromium CDP.');
      const context = await browser.newContext({
        viewport: { width: profile.width, height: profile.height }, serviceWorkers: 'block',
      });
      let cdp: CDPSession | undefined;
      try {
        const page = await context.newPage();
        cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false, latency: profile.latencyMs,
          downloadThroughput: profile.downloadBytesPerSecond, uploadThroughput: profile.uploadBytesPerSecond,
        });
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuRate });
        await page.addInitScript(character => {
          performance.setResourceTimingBufferSize(2000);
          localStorage.setItem('english-rpg-save', JSON.stringify({ version: 26, state: {
            character, prologueDone: true, tutorialDone: true, unlockedIndex: 3,
            gold: 1234, tickets: 7, weaponTickets: 3, storySeen: [],
            settings: { musicVolume: 0, sfxVolume: 0, volume: 0, autoSpeak: false, voiceAsSpelling: true },
          } }));
        }, { ...DEFAULT_CHARACTER, name: '效能隔離驗收' });
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 100_000 });
        const adventure = page.getByRole('button', { name: /副本與挑戰/ });
        await expect(adventure).toBeVisible({ timeout: 100_000 });
        const adventureVisibleMs = await page.evaluate(() => performance.now());
        await adventure.click();
        await page.getByRole('button', { name: '護送商隊 🛒', exact: true }).click();
        await expect(page.getByRole('heading', { name: '第一節：選最快的安全路線', exact: true })).toBeVisible({ timeout: 100_000 });
        const caravanVisibleMs = await page.evaluate(() => performance.now());
        const metrics = await readMetrics(page, adventureVisibleMs, caravanVisibleMs);
        expect(metrics.adventureVisibleMs).toBeGreaterThan(0);
        expect(metrics.caravanVisibleMs).toBeGreaterThanOrEqual(metrics.adventureVisibleMs);
        samples.push({ profile, metrics, browserVersion: browser.version() });
      } finally {
        await cdp?.detach().catch(() => undefined);
        await context.close();
      }
    });
  }
});
