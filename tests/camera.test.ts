import { describe, expect, it } from 'vitest';
import { sampleJourney, JOURNEY_DURATION } from '../src/scene/camera-path';
describe('cinematic camera loop', () => {
  it('joins without a visible position or gaze jump at 48 seconds', () => {
    const start = sampleJourney(0);
    const end = sampleJourney(JOURNEY_DURATION - 0.0001);
    expect(start.position.distanceTo(end.position)).toBeLessThan(0.01);
    expect(start.target.distanceTo(end.target)).toBeLessThan(0.01);
  });
  it('has matching velocity across the loop seam', () => {
    const h = 0.001;
    const left = sampleJourney(0).position.clone().sub(sampleJourney(-h).position).divideScalar(h);
    const right = sampleJourney(h).position.clone().sub(sampleJourney(0).position).divideScalar(h);
    expect(left.distanceTo(right)).toBeLessThan(0.02);
  });
  it('remains finite, above the water, and far from its look target', () => {
    for (let t = 0; t < JOURNEY_DURATION; t += 0.1) {
      const { position, target } = sampleJourney(t);
      expect([...position.toArray(), ...target.toArray()].every(Number.isFinite)).toBe(true);
      expect(position.y).toBeGreaterThan(1);
      expect(position.distanceTo(target)).toBeGreaterThan(4);
    }
  });
  it('wraps both forward and negative time', () => {
    expect(sampleJourney(6).position.distanceTo(sampleJourney(54).position)).toBeLessThan(0.0001);
    expect(sampleJourney(-2).position.distanceTo(sampleJourney(46).position)).toBeLessThan(0.0001);
  });
});
