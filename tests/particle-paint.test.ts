import { describe, expect, it } from 'vitest';
import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three';
import { samplePaintCloud } from '../src/scene/particle-paint';

describe('volumetric pigment sampling', () => {
  const mesh = new Mesh(new BoxGeometry(12, 24, 6), new MeshStandardMaterial({ color: '#aa6551' }));
  mesh.position.set(0, 14, -24); mesh.updateMatrixWorld(true);

  it('produces finite, colored particles within a fixed point budget', () => {
    const cloud = samplePaintCloud([mesh], 1024, 819);
    expect(cloud.getAttribute('position').count).toBe(1024);
    for (const name of ['position', 'color', 'seed', 'size', 'mobility']) {
      expect(Array.from(cloud.getAttribute(name).array).every(Number.isFinite)).toBe(true);
    }
    expect(Array.from(cloud.getAttribute('color').array).every(c => c >= 0 && c <= 1)).toBe(true);
    cloud.dispose();
  });

  it('has real thickness rather than lying on hard box faces', () => {
    const cloud = samplePaintCloud([mesh], 1024, 819);
    const p = cloud.getAttribute('position');
    let offAllFaces = 0;
    for (let i = 0; i < p.count; i++) {
      const faceDistances = [Math.abs(Math.abs(p.getX(i)) - 6),
        Math.abs(Math.abs(p.getY(i) - 14) - 12), Math.abs(Math.abs(p.getZ(i) + 24) - 3)];
      if (faceDistances.every(d => d > .01)) offAllFaces++;
    }
    expect(offAllFaces / p.count).toBeGreaterThan(.8);
    cloud.dispose();
  });

  it('reproduces the same pigment field for the same seed', () => {
    const a = samplePaintCloud([mesh], 1024, 819), b = samplePaintCloud([mesh], 1024, 819);
    expect(Array.from(a.getAttribute('position').array)).toEqual(Array.from(b.getAttribute('position').array));
    expect(Array.from(a.getAttribute('color').array)).toEqual(Array.from(b.getAttribute('color').array));
    a.dispose(); b.dispose();
  });
});
