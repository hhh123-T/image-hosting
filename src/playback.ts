import { JOURNEY_DURATION } from './scene/camera-path';
export class Playback {
  time = 0;
  speed = 1;
  constructor(public playing: boolean) {}
  advance(delta: number) {
    if (this.playing && Number.isFinite(delta)) {
      this.time = (this.time + Math.max(0, delta) * this.speed) % JOURNEY_DURATION;
    }
  }
  seek(seconds: number) {
    if (Number.isFinite(seconds)) this.time = Math.max(0, Math.min(JOURNEY_DURATION - 0.001, seconds));
  }
  reset() { this.time = 0; }
}
