import { chromium } from '/home/hatch/workspace/makefun-gta6/tools/node_modules/playwright-core/index.mjs';
import { mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const repo = resolve(new URL('..', import.meta.url).pathname);
await mkdir(resolve(repo, 'screenshots'), { recursive: true });
const baseUrl = 'http://127.0.0.1:8080';
if (!(await fetch(baseUrl).then((response) => response.ok).catch(() => false))) throw new Error(`No game server at ${baseUrl}`);
let browser;
try {
  browser = await chromium.launch({ executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errors = { start: [], foot: [], drive: [] };
  let shot = 'start';
  page.on('pageerror', error => errors[shot].push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors[shot].push(message.text()); });
  page.on('requestfailed', request => errors[shot].push(`FAILED ${request.url()}`));
  page.on('response', response => { if (response.status() >= 400) errors[shot].push(`${response.status()} ${response.url()}`); });
  for (const name of ['start', 'foot', 'drive']) {
    shot = name;
    await page.goto(`${baseUrl}/?shot=${name}&seed=611&audit=1`);
    await page.waitForTimeout(name === 'drive' ? 3000 : 1800);
    if (name === 'drive') await page.screenshot({ path: resolve(repo, 'screenshots/3-drive.jpg'), type: 'jpeg', quality: 78 });
  }
  const driveState = await page.evaluate(() => ({
    label: document.querySelector('#driving')?.textContent,
    map: (() => { const c=document.querySelector('#map'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let dots=0; for(let i=0;i<d.length;i+=4) if((d[i]<65&&d[i+1]<95&&d[i+2]<105)||(d[i]>220&&d[i+1]<105&&d[i+2]<90)) dots++; return dots; })(),
    audit: window.__solmarAudit(),
  }));
  await page.waitForTimeout(1500);
  const afterIdle = await page.evaluate(() => window.__solmarAudit());
  const beforeDrive = await page.screenshot({ type: 'jpeg', quality: 55 });
  await page.keyboard.down('KeyW'); await page.waitForTimeout(2600); await page.keyboard.up('KeyW');
  const movingLabel = await page.locator('#driving').textContent();
  const afterDrive = await page.evaluate(() => window.__solmarAudit());
  const beforeSteer = await page.screenshot({ type: 'jpeg', quality: 55 });
  await page.keyboard.down('KeyA'); await page.waitForTimeout(500); await page.keyboard.up('KeyA');
  const afterSteer = await page.screenshot({ type: 'jpeg', quality: 55 });
  const steeredState = await page.evaluate(() => window.__solmarAudit());
  await page.keyboard.press('KeyE');
  const exited = await page.locator('#driving').textContent();
  await page.keyboard.press('KeyE');
  const reentered = await page.locator('#driving').textContent();
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('solmar-heat-save-v2') || 'null'));
  await page.reload(); await page.waitForTimeout(500);
  const loaded = await page.evaluate(() => JSON.parse(localStorage.getItem('solmar-heat-save-v2') || 'null'));
  const sizes = await Promise.all(['screenshots/1-start.jpg','screenshots/2-foot.jpg','screenshots/3-drive.jpg'].map(async name => [name,(await stat(resolve(repo,name))).size]));
  const result = { errors, drivingShot: driveState.label, minimapCarDotPixels: driveState.map, trafficMoved: driveState.audit.traffic.some((car,i)=>Math.hypot(car.x-afterIdle.traffic[i].x,car.z-afterIdle.traffic[i].z)>.25), pedestriansWalked: driveState.audit.pedestrians.some((p,i)=>Math.hypot(p.x-afterIdle.pedestrians[i].x,p.z-afterIdle.pedestrians[i].z)>.25), speedAfterW: movingLabel, carMoved: Math.hypot(afterDrive.activeCar.x-driveState.audit.activeCar.x,afterDrive.activeCar.z-driveState.audit.activeCar.z)>.05, cameraFollowed: Math.hypot(afterDrive.camera.x-driveState.audit.camera.x,afterDrive.camera.z-driveState.audit.camera.z)>.05, carSteered: steeredState.activeCar.yaw!==afterDrive.activeCar.yaw, exitLabel: exited, reenterLabel: reentered, cameraChangedWhileSteering: !beforeSteer.equals(afterSteer), viewChangedWhileDriving: !beforeDrive.equals(beforeSteer), saveLoad: !!saved && !!loaded && saved.carX === loaded.carX && saved.inCar === loaded.inCar, saved, sizes };
  console.log(JSON.stringify(result,null,2));
  if (Object.values(errors).some(list=>list.length) || !String(driveState.label).startsWith('IN CAR') || !String(movingLabel).startsWith('IN CAR') || !String(exited).startsWith('ON FOOT') || !String(reentered).startsWith('IN CAR') || driveState.map<10 || !result.trafficMoved || !result.pedestriansWalked || !result.carMoved || !result.cameraFollowed || !result.carSteered || !result.saveLoad || sizes.some(([,size])=>size>262144)) throw new Error('Stage 2 browser verification failed');
} finally { if (browser) await browser.close(); }
