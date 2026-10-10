import { expect, test } from '@playwright/test';
test('renders a live world and playback/framing/cinema controls work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('[data-render-state]')).toHaveAttribute('data-render-state', 'ready');
  await expect.poll(() => page.locator('#timeline').inputValue()).not.toBe('0');
  await page.getByRole('button', { name: '暂停运镜', exact: true }).click();
  const paused = await page.locator('#timeline').inputValue();
  await page.waitForTimeout(400);
  expect(await page.locator('#timeline').inputValue()).toBe(paused);
  await page.getByRole('button', { name: '从头播放', exact: true }).click();
  expect(Number(await page.locator('#timeline').inputValue())).toBeLessThan(0.5);
  await page.getByRole('button', { name: '切换为竖屏画幅', exact: true }).click();
  await expect(page.locator('#stage')).toHaveClass(/portrait/);
  const size = await page.locator('canvas').boundingBox();
  expect(size!.width / size!.height).toBeCloseTo(9 / 16, 1);
  await page.getByRole('button', { name: '进入纯画面模式', exact: true }).click();
  await expect(page.locator('body')).toHaveClass(/cinema/);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/cinema/);
  await page.getByRole('button', { name: '关于这件作品', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '关闭作品介绍', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('cinema shortcut works after using the playback button', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-render-state]')).toHaveAttribute('data-render-state', 'ready');
  await page.getByRole('button', { name: '暂停运镜', exact: true }).click();
  await page.keyboard.press('c');
  await expect(page.locator('body')).toHaveClass(/cinema/);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/cinema/);
});

test('Space pauses the camera after entering cinema without exiting it', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-render-state]')).toHaveAttribute('data-render-state', 'ready');
  await page.getByRole('button', { name: '进入纯画面模式', exact: true }).click();
  await page.keyboard.press('Space');
  await expect(page.locator('body')).toHaveClass(/cinema/);
  await expect(page.locator('#play')).toHaveAttribute('aria-label', '播放运镜');
});

test('dragging the timeline holds time and pointer cancellation resumes playback', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-render-state]')).toHaveAttribute('data-render-state', 'ready');
  const timeline = page.locator('#timeline');
  const bounds = await timeline.boundingBox();
  await page.mouse.move(bounds!.x + bounds!.width * .4, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  const selectedSeconds = Math.floor(Number(await timeline.inputValue()));
  await expect(page.locator('#time')).toHaveText(`00:${String(selectedSeconds).padStart(2, '0')}`);
  const heldTime = await page.locator('#time').textContent();
  await page.waitForTimeout(1200);
  expect(await page.locator('#time').textContent()).toBe(heldTime);
  await expect(page.locator('#play')).toHaveAttribute('aria-label', '播放运镜');
  await timeline.dispatchEvent('pointercancel');
  await expect(page.locator('#play')).toHaveAttribute('aria-label', '暂停运镜');
  await page.mouse.up();
});

test('shows recovery instructions when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind.startsWith('webgl')) return null;
      return (original as (...args: unknown[]) => RenderingContext | null).call(this, kind, ...args);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('WebGL 2');
  await expect(page.getByRole('button', { name: '重新加载', exact: true })).toBeVisible();
  await expect(page.locator('#play')).toBeDisabled();
});

test('the entire camera journey stays clear of solid architecture', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-render-state]')).toHaveAttribute('data-render-state', 'ready');
  const collisions = await page.evaluate(async () => {
    // Import production modules in the browser so painterly texture creation uses real Canvas.
    const { createWorld } = await import('/src/scene/world.ts');
    const { sampleJourney } = await import('/src/scene/camera-path.ts');
    const { Box3 } = await import('/node_modules/.vite/deps/three.js');
    const world = createWorld();
    world.scene.updateMatrixWorld(true);
    const boxes: { box: InstanceType<typeof Box3>; name: string }[] = [];
    world.scene.traverse((object: { geometry?: { type: string }; uuid: string; isInstancedMesh?: boolean }) => {
      if (object.geometry?.type === 'BoxGeometry' && !object.isInstancedMesh) boxes.push({ box: new Box3().setFromObject(object).expandByScalar(.45), name: object.uuid });
    });
    const hits: number[] = [];
    for (let time = 0; time < 48; time += .05) {
      const { position } = sampleJourney(time);
      if (boxes.some(({ box }) => box.containsPoint(position))) hits.push(Number(time.toFixed(2)));
    }
    world.dispose();
    return hits;
  });
  expect(collisions).toEqual([]);
});
test('reduced motion starts paused and phone controls remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('[data-render-state]')).toHaveAttribute('data-render-state', 'ready');
  await expect(page.getByRole('button', { name: '播放运镜', exact: true })).toBeVisible();
  expect(Number(await page.locator('#timeline').inputValue())).toBe(0);
  await expect(page.getByRole('button', { name: '进入纯画面模式', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
