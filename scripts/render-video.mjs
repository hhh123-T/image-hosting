import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

// Sample the real Three.js scene at deterministic times, independent of machine rendering speed.
const output = process.env.COURTYARD_ARTIFACTS || '/workspace/artifacts/endless-courtyard-v3';
const fps = Number(process.env.COURTYARD_FPS || 24);
const width = Number(process.env.COURTYARD_WIDTH || 720);
const height = Number(process.env.COURTYARD_HEIGHT || 1280);
const seconds = Number(process.env.COURTYARD_SECONDS || 48);
const filename = `${output}/endless-courtyard-portrait.mp4`;
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(process.env.COURTYARD_URL || 'http://127.0.0.1:5173');
await page.waitForSelector('[data-render-state="ready"]');
await page.waitForSelector('[data-environment-state="ready"], [data-environment-state="fallback"]');
await page.getByRole('button', { name: '进入纯画面模式', exact: true }).click();
await page.locator('#exit-cinema').blur();
await page.evaluate(() => document.body.classList.remove('show-exit'));
const ffmpeg = spawn('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps),
  '-vcodec', 'mjpeg', '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'fast',
  '-crf', '18', '-threads', '2', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', filename,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const finished = once(ffmpeg, 'exit');
const start = Date.now();
try {
  for (let frame = 0; frame < seconds * fps; frame++) {
    await page.evaluate(async seconds => {
      const input = document.querySelector('#timeline');
      // Keep exact frame times instead of snapping to the UI slider's 0.01s step.
      input.step = 'any';
      input.value = String(seconds);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }, frame / fps);
    const buffer = await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!ffmpeg.stdin.write(buffer)) await once(ffmpeg.stdin, 'drain');
    if (frame % fps === 0) console.log(`Rendered ${(frame / fps).toFixed(0)}/${seconds} seconds (${((Date.now() - start) / 1000).toFixed(1)}s elapsed)`);
  }
  ffmpeg.stdin.end();
  const [code] = await finished;
  if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Saved ${filename} — ${seconds} seconds, ${width}×${height}, ${fps}fps, no audio`);
} finally {
  if (!ffmpeg.stdin.writableEnded) ffmpeg.stdin.end();
  await browser.close();
}
