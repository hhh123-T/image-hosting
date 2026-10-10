import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const output = process.env.COURTYARD_ARTIFACTS || '/workspace/artifacts/endless-courtyard';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
page.on('pageerror', error => console.error(error.message));
await page.goto(process.env.COURTYARD_URL || 'http://127.0.0.1:5173');
await page.waitForSelector('[data-render-state="ready"]');
await page.screenshot({ path: `${output}/courtyard-desktop.png`, fullPage: true });
await page.getByRole('button', { name: '进入纯画面模式', exact: true }).click();
await page.evaluate(() => document.body.classList.remove('show-exit'));
await page.locator('#exit-cinema').blur();
await page.waitForTimeout(500);
for (const [seconds, name] of [[0, 'water'], [19, 'portal'], [34, 'aerial']]) {
  await page.locator('#timeline').evaluate((input, seconds) => {
    input.value = String(seconds); input.dispatchEvent(new Event('input', { bubbles: true }));
  }, seconds);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${output}/courtyard-${name}.png` });
}
await page.keyboard.press('Escape');
await page.locator('#cinema').blur();
await page.setViewportSize({ width: 390, height: 844 });
await page.locator('#timeline').evaluate(input => { input.value = '0'; input.dispatchEvent(new Event('input', { bubbles: true })); });
await page.waitForTimeout(500);
await page.screenshot({ path: `${output}/courtyard-phone.png`, fullPage: true });
await browser.close();
console.log(`Saved stills to ${output}`);
