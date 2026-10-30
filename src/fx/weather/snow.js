import { ramp, lerp, TAU } from "../../core/index.js";
import { box, clip, drift } from "./_lib.js";

export const meta = {
  name: "Snow",
  desc: "Snow drifting down in three depths: faint specks far off, single flakes swaying in the middle, big soft flakes floating close by.",
  tags: ["weather", "snow", "winter", "cold", "ambient", "loop"],
  size: [128, 72],
  origin: [64, 36],
  duration: 6,
  loop: true,
  fps: 30,
  bg: "sky",
  options: { palette: ["#3a4660", "#6a7a98", "#a8b8d0", "#e4eef8", "#ffffff"], count: 80, seed: 79 },
};

const FLAKE = [".a.", "aba", ".a."];
const BIG = ["..a..", ".aba.", "abcba", ".aba.", "..a.."];

export function draw(p, t, o) {
  p = clip(p, meta);
  const C = ramp(o.palette), S = o.seed, D = meta.duration, B = box(meta), n = o.count;
  // each flake falls from above the frame to below it; a longer trip (more of it hidden) means a faster flake
  const fall = (u, r, extra) => lerp(B.y0 - 4 - extra * r.next(), B.y1 + 4, u);
  // far: dim specks, slow, barely swaying
  drift(t, D, Math.round(n * 0.5), S, 1, (u, r) => {
    const y = fall(u, r, 20), x0 = r.range(B.x0, B.x1), sw = Math.sin(u * TAU * 1.5 + r.next() * TAU) * 2;
    p.px(x0 + sw, y, C[1]);
  });
  // middle: single bright flakes swaying as they fall
  drift(t, D, Math.round(n * 0.35), S + 1, [1, 2], (u, r) => {
    const y = fall(u, r, 40), x0 = r.range(B.x0, B.x1), sw = Math.sin(u * TAU * r.range(1.5, 3) + r.next() * TAU) * r.range(3, 6);
    p.px(x0 + sw + u * 6, y, r.chance(0.3) ? C[4] : C[3]);
  });
  // near: big soft flakes floating down, swinging wide
  drift(t, D, Math.round(n * 0.15), S + 2, [2, 3], (u, r, i) => {
    const y = fall(u, r, 60), x0 = r.range(B.x0, B.x1), sw = Math.sin(u * TAU * r.range(1.5, 2.5) + r.next() * TAU) * r.range(6, 10);
    const big = i % 3 === 0, x = x0 + sw + u * 10;
    p.sprite(big ? BIG : FLAKE, { a: C[2], b: C[3], c: C[4] }, x - (big ? 2 : 1), y - (big ? 2 : 1));
    if (!big) p.px(x, y, C[4]);
    p.light(x, y, C[3], big ? 0.25 : 0.12);
  });
}
