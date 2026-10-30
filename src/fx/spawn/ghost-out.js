import { ramp, at, cycle, stream, seg, ease, WHITE } from "../../core/index.js";
import { steps } from "./_lib.js";

export const meta = {
  name: "Ghost out",
  desc: "A little sheet ghost pops up out of the fallen, its skirt rippling, sways upward on a lazy wave and fades out, dropping pale wisps.",
  tags: ["spawn", "death", "ghost", "spirit", "cartoon", "one-shot"],
  size: [40, 60],
  origin: [20, 54],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#1e1a34", "#3c3660", "#6a6496", "#a8a4cc", "#dcdcf0", "#ffffff"], seed: 22 },
};

// two frames of a sheet ghost: the skirt's hem ripples between them
const BODY = [
  "...ooooo...",
  "..owwwhho..",
  ".owwwwwhho.",
  ".owwwwwwwo.",
  "owwewwwewwo",
  "owwewwwewwo",
  "owwwwwwwwwo",
  "owwwwmwwwwo",
  "owwwwwwwwwo",
  "oswwwwwwwso",
  "osswwwwwsso",
];
const HEM = [
  ["osossosssoo", ".o..o...o.."],
  ["oossosssoso", "..o...o..o."],
];

export function draw(p, t, o) {
  const C = steps(ramp(o.palette), 6), S = o.seed;
  const pal = { o: at(C, 0.3), w: at(C, 0.8), h: WHITE, s: at(C, 0.6), e: C[0], m: C[1] };
  // rise: pops out of the ground with an overshoot, then drifts up on a lazy wave
  const pop = ease.outBack(seg(t, 0, 0.22), 2), drift = Math.max(0, t - 0.22);
  const x = Math.round(Math.sin(drift * 4.2) * 4 * seg(t, 0.15, 0.5)), y = Math.round(-1 - 17 * pop - drift * 17);
  const fade = 1 - seg(t, 1.05, 1.6);
  // wisps: pale drops shed from the hem, sinking and fading
  stream(t, 0.25, 1.4, 7, S, (r) => r.range(0.35, 0.55), (age, life, r, i) => {
    const t0 = 0.25 + i / 7, d0 = Math.max(0, t0 - 0.22), k = age / life;
    const wx = Math.round(Math.sin(d0 * 4.2) * 4 * seg(t0, 0.15, 0.5) + r.range(-4, 4)), wy = Math.round(-18 - d0 * 17 + 1 + age * r.range(8, 14));
    if (k > 0.7 && Math.floor(age * 20) % 2) return;
    p.px(wx, wy, k < 0.4 ? at(C, 0.8) : at(C, 0.6)), p.px(wx, wy - 1, k < 0.4 ? at(C, 0.6) : at(C, 0.4));
  });
  const hem = HEM[Math.floor(t * 8) % 2];
  const rows = [...BODY, ...hem];
  // squash on landing at the top of the pop, stretch while it springs up
  p.sprite(rows, pal, x - 5, y - rows.length, { a: fade });
  p.glow(x, y - 7, 18, at(C, 0.7), 0.25 * fade);
  // a puff of pale motes where it came out
  cycle(t, meta.duration, 6, S + 1, 0.5, (age, life, r, i) => {
    if (t > 0.6) return;
    const k = age / life, a = r.range(-Math.PI, 0), d = 3 + age * r.range(14, 26);
    p.px(Math.cos(a) * d, -1 + Math.sin(a) * d * 0.6, k < 0.5 ? WHITE : at(C, 0.7));
  });
}
