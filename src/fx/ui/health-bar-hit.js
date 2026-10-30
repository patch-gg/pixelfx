import { PAL, RAMP, hex, burst, seg, ease, WHITE } from "../../core/index.js";
import { shake, fit } from "./_lib.js";

export const meta = {
  name: "Health bar hit",
  desc: "A segmented health bar takes a hit: it jolts, the lost chunk flashes white and turns to a gold chip that hangs a beat, then drains away to the new value.",
  tags: ["ui", "health", "bar", "damage", "hud", "one-shot"],
  size: [76, 28],
  origin: [38, 14],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.leaf, from: 0.8, to: 0.45, seed: 14 },
};

const GOLD = RAMP.gold, RED = RAMP.blood, FRAME = ["#0b0a10", "#2a2638", "#4a4562", "#7a7494"].map(hex);
const HEART = [".aa.aa.", "abbabba", "abcbbba", "abbbbba", ".abbba.", "..aba..", "...a..."];
const W = 52, X0 = -24, HIT = 0.2;

export function draw(p, t, o) {
  const C = fit(o.palette), S = o.seed, fade = 1 - seg(t, 1.55, 1.75);
  if (fade <= 0) return;
  const [jx, jy] = shake(t, 2.2, HIT, 0.28, S, 40);
  const hurt = t >= HIT && t < HIT + 0.07;
  // the values: the fill drops at once; the chip hangs, then drains after it
  const now = t < HIT ? o.from : o.to;
  const chip = t < HIT ? o.from : o.from - (o.from - o.to) * ease.inOutQuad(seg(t, HIT + 0.42, HIT + 0.85));
  const x = X0 + jx, y = -3 + jy;
  // the frame: a dark case with a lit top edge; it flashes red on the hit
  p.rect(x - 2, y - 2, W + 4, 10, FRAME[0], fade);
  p.rect(x - 1, y - 1, W + 2, 8, hurt ? RED[4] : FRAME[2], fade);
  p.rect(x - 1, y - 1, W + 2, 1, hurt ? RED[6] : FRAME[3], fade);
  p.rect(x, y, W, 6, FRAME[1], fade);
  // the gold chip of lost health, white for the first frames
  const fw = Math.round(W * now), cw = Math.round(W * chip);
  if (cw > fw) {
    const white = t < HIT + 0.1;
    for (let r = 0; r < 6; r++) p.rect(x + fw, y + r, cw - fw, 1, white ? WHITE : r < 2 ? GOLD[6] : r < 4 ? GOLD[5] : GOLD[4], fade);
  }
  // the fill: banded light to dark, cut into segments
  for (let r = 0; r < 6; r++) p.rect(x, y + r, fw, 1, r === 0 ? C[6] : r < 3 ? C[5] : r < 5 ? C[4] : C[3], fade);
  for (let s = 10; s < fw; s += 10) p.rect(x + s, y, 1, 6, C[2], fade);
  if (fw > 0) p.rect(x + fw - 1, y, 1, 6, C[6], fade); // a bright leading edge
  // the heart badge on the end, jolting with the hit
  p.sprite(HEART, { a: FRAME[0], b: hurt ? WHITE : RED[4], c: WHITE }, x - 9, y - 2 + (hurt ? -1 : 0), { a: fade });
  // chips of the bar fly off where it broke
  burst(6, S, (r, i) => {
    const age = t - HIT, life = r.range(0.28, 0.4);
    if (age < 0 || age > life) return;
    const px = x + fw + r.range(0, (o.from - o.to) * W), vx = r.range(-20, 50), vy = -r.range(40, 80);
    p.rect(Math.round(px + vx * age), Math.round(y + 2 + vy * age + 130 * age * age), 1 + (i % 2), 1 + (i % 2), age / life < 0.4 ? WHITE : GOLD[5], fade);
  });
  if (hurt) p.glow(x + W / 2, y + 3, 30, RED[4], 0.4);
}
