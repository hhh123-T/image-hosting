import { CatmullRomCurve3, Vector3 } from 'three';
export const JOURNEY_DURATION = 48;
const route = new CatmullRomCurve3([
  new Vector3(16, 18, 48),
  new Vector3(10, 13, 22),
  new Vector3(1, 8, -17),
  new Vector3(0, 12, -50),
  new Vector3(-28, 29, -42),
  new Vector3(-58, 40, 1),
  new Vector3(-42, 34, 62),
  new Vector3(-5, 22, 73),
], true, 'catmullrom', 0.45);
const gaze = new CatmullRomCurve3([
  new Vector3(1, 22, -25), new Vector3(0, 18, -25),
  new Vector3(0, 15, -44), new Vector3(0, 22, -98),
  new Vector3(0, 25, -56), new Vector3(0, 24, -25),
  new Vector3(0, 23, -38), new Vector3(0, 23, -25),
], true, 'catmullrom', 0.4);

export function sampleJourney(seconds: number) {
  const t = ((seconds % JOURNEY_DURATION) + JOURNEY_DURATION) % JOURNEY_DURATION / JOURNEY_DURATION;
  return {
    position: route.getPoint(t), target: gaze.getPoint(t),
    chapter: t < 0.33 ? '01 / 水上漫游' : t < 0.62 ? '02 / 穿过画境' : '03 / 无垠之上',
  };
}
