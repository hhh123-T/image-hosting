import { expect, test } from '@playwright/test';

test('charcoal stays charcoal when spherical UVs wrap across their seam', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-render-state]')).toHaveAttribute('data-render-state', 'ready');
  const pixel = await page.evaluate(async () => {
    const { createMaterials, loadPaintAtlas } = await import('/src/scene/materials.ts');
    const { WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry, MeshBasicMaterial, Mesh } =
      await import('/node_modules/.vite/deps/three.js');
    const paints = createMaterials();
    const atlas = await loadPaintAtlas(paints, () => false);
    if (!atlas) throw new Error('Paint texture fixture failed to load.');
    const geometry = new PlaneGeometry(2, 2);
    // This UV occurs at the seam of Three's IcosahedronGeometry.
    for (let i = 0; i < geometry.attributes.uv.count; i++) geometry.attributes.uv.setXY(i, 1.05807, .45);
    const material = new MeshBasicMaterial({ map: paints.dark.map });
    const scene = new Scene(); scene.add(new Mesh(geometry, material));
    const camera = new OrthographicCamera(-1, 1, 1, -1, .1, 10); camera.position.z = 2;
    const renderer = new WebGLRenderer(); renderer.setSize(32, 32);
    renderer.render(scene, camera);
    const gl = renderer.getContext(), rgba = new Uint8Array(4);
    gl.readPixels(16, 16, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    geometry.dispose(); material.dispose(); renderer.dispose();
    for (const texture of new Set(Object.values(paints).map(p => p.map))) texture?.dispose();
    for (const paint of Object.values(paints)) paint.dispose();
    return Array.from(rgba);
  });
  expect(pixel[3]).toBe(255);
  expect(pixel[0]).toBeLessThan(pixel[2] * 1.4);
});
