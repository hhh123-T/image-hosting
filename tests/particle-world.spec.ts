import { expect, test } from '@playwright/test';

for (const fallback of [false, true]) {
  test(`the enveloping painting is made of particles${fallback ? ' when its pigment atlas is unavailable' : ''}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    if (fallback) await page.route('**/textures/*.png', route => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-render-state]')).toHaveAttribute('data-render-state', 'ready');
    const result = await page.evaluate(async () => {
      const { createWorld } = await import('/src/scene/world.ts');
      const world = createWorld();
      await world.ready;
      let hardSurfaces = 0, count = 0, enveloping = false;
      const phases = (time: number) => {
        world.update(time);
        const values: number[] = [];
        world.scene.traverse((object: any) => {
          if (object.isPoints && object.material.uniforms?.phase) values.push(object.material.uniforms.phase.value);
        });
        return values;
      };
      world.scene.traverse((object: any) => {
        if (object.isMesh && object.visible && object.geometry.type !== 'SphereGeometry') hardSurfaces++;
        if (object.isPoints && object.visible) {
          count += object.geometry.getAttribute('position').count;
          enveloping ||= object.name === 'Enveloping ink atmosphere';
        }
      });
      const start = phases(0), end = phases(48);
      world.dispose();
      return { hardSurfaces, count, enveloping, start, end };
    });
    expect(result.hardSurfaces).toBe(0);
    expect(result.count).toBeGreaterThanOrEqual(150000);
    expect(result.count).toBeLessThanOrEqual(550000);
    expect(result.enveloping).toBe(true);
    expect(result.start.length).toBeGreaterThan(0);
    expect(result.end).toEqual(result.start);
  });
}

test('a delayed surrounding panorama does not block the painting and updates a paused frame', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/textures/ink-panorama.png', async route => { await held; await route.continue(); });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const scene = page.locator('[data-render-state]');
    await expect(scene).toHaveAttribute('data-render-state', 'ready');
    await expect(scene).toHaveAttribute('data-environment-state', 'loading');
    const before = await page.locator('canvas').screenshot();
    release();
    await expect(scene).toHaveAttribute('data-environment-state', 'ready');
    const after = await page.locator('canvas').screenshot();
    expect(after.equals(before)).toBe(false);
  } finally { release(); }
});
