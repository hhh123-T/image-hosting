import { describe, expect, it } from 'vitest';
import { Playback } from '../src/playback';
describe('playback state', () => {
  it('advances only when playing and respects speed', () => {
    const playback = new Playback(false);
    playback.advance(2);
    expect(playback.time).toBe(0);
    playback.playing = true;
    playback.speed = 0.5;
    playback.advance(2);
    expect(playback.time).toBe(1);
  });
  it('wraps the loop and clamps scrubbing to its bounds', () => {
    const playback = new Playback(true);
    playback.seek(47); playback.advance(2);
    expect(playback.time).toBe(1);
    playback.seek(-10); expect(playback.time).toBe(0);
    playback.seek(100);
    expect(playback.time).toBeLessThan(48);
    expect(playback.time).toBeGreaterThan(47.9);
  });
  it('reset preserves playing state and speed', () => {
    const playback = new Playback(false);
    playback.speed = 1.5; playback.seek(25); playback.reset();
    expect(playback.time).toBe(0);
    expect(playback.playing).toBe(false);
    expect(playback.speed).toBe(1.5);
  });
});
