import { chromium } from '/home/hatch/workspace/makefun-gta6/tools/node_modules/playwright-core/index.mjs';
import { mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const repo = resolve(new URL('..', import.meta.url).pathname);
await mkdir(resolve(repo, 'screenshots'), { recursive: true });
const baseUrl = 'http://127.0.0.1:8081';
if (!(await fetch(baseUrl).then((response) => response.ok).catch(() => false))) throw new Error(`No game server at ${baseUrl}`);

let browser;
try {
  browser = await chromium.launch({
    executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  let currentShot = 'start';
  const errors = { start: [], foot: [] };
  page.on('pageerror', (error) => errors[currentShot].push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors[currentShot].push(`${message.text()} ${JSON.stringify(message.location())}`); });
  page.on('response', (response) => { if (response.status() >= 400) errors[currentShot].push(`${response.status()} ${response.url()}`); });
  await page.goto(`${baseUrl}/?shot=start&seed=1`);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: resolve(repo, 'screenshots/1-start.jpg'), type: 'jpeg', quality: 82 });
  currentShot = 'foot';
  await page.goto(`${baseUrl}/?shot=foot&seed=1`);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: resolve(repo, 'screenshots/2-foot.jpg'), type: 'jpeg', quality: 78 });
  const before = await page.evaluate(() => ({ map: (() => { const canvas = document.querySelector('#map'); const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data; return canvas.width === 280 && data.some((value, index) => index % 4 === 3 && value > 0); })() }));
  const frameBeforeOrbit = await page.screenshot({ type: 'jpeg', quality: 55 });
  await page.mouse.move(600, 360);
  await page.mouse.down();
  await page.mouse.move(820, 360, { steps: 5 });
  await page.mouse.up();
  await page.keyboard.down('w');
  await page.waitForTimeout(1800);
  await page.keyboard.up('w');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('solmar-heat-save-v2') || 'null'));
  const frameAfterOrbit = await page.screenshot({ type: 'jpeg', quality: 55 });
  const moved = !!saved && Math.hypot(saved.x, saved.z) > .5;
  const cameraOrbited = !frameBeforeOrbit.equals(frameAfterOrbit);
  await page.goto(`${baseUrl}/?seed=1`);
  await page.waitForTimeout(800);
  await page.locator('#start').click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('solmar-heat-save-v2') || 'null'));
  const sizes = await Promise.all(['screenshots/1-start.jpg', 'screenshots/2-foot.jpg'].map(async (name) => [name, (await stat(resolve(repo, name))).size]));
  console.log(JSON.stringify({ errors, movement: moved, position: saved && { x: saved.x, z: saved.z }, cameraOrbited, minimap: before?.map, saveLoad: !!saved && !!restored && saved.z === restored.z && saved.x === restored.x, sizes }, null, 2));
} finally {
  if (browser) await browser.close();
}
