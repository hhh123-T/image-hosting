import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const output = process.env.COURTYARD_ARTIFACTS || '/workspace/artifacts/endless-courtyard-v3';
const times = (process.env.COURTYARD_TIMES || '0,6,12,18,24,30,36,42').split(',').map(Number);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 900 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
try {
  await page.goto(process.env.COURTYARD_URL || 'http://127.0.0.1:5173');
  await page.waitForSelector('[data-render-state="ready"]');
  await page.waitForSelector('[data-environment-state="ready"], [data-environment-state="fallback"]');
  await page.getByRole('button', { name: '进入纯画面模式', exact: true }).click();
  await page.locator('#exit-cinema').blur();
  await page.evaluate(() => document.body.classList.remove('show-exit'));
  for (const [name, width, height] of [['square', 900, 900], ['portrait', 720, 1280]]) {
    await page.setViewportSize({ width, height });
    for (const time of times) {
      const start = Date.now();
      await page.evaluate(async time => {
        const input = document.querySelector('#timeline');
        input.value = String(time); input.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      }, time);
      const rendered = Date.now();
      await page.screenshot({ path: `${output}/${name}-${String(time).padStart(2, '0')}.png` });
      console.log(`${name} ${time}s: render=${rendered - start}ms, screenshot=${Date.now() - rendered}ms`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
} finally { await browser.close(); }
