// Shared by the screen transitions: a 160 x 90 screen with its origin at the top-left, a cover that closes by
// about 45% of the duration, holds, then opens again so the last frame is empty.

import { seg, ramp } from "../../core/index.js";

export const W = 160, H = 90;

/** The accent palette as colors, padded at the dark end to 8 steps so short ramps still fill every role. */
export function accents(palette) {
  const C = ramp(palette);
  while (C.length < 8) C.unshift(C[0]);
  return C;
}

/** The meta every transition shares; pass what differs. */
export function screenMeta({ name, desc, tags, duration, options }) {
  return {
    name, desc, tags: ["transition", "screen", ...tags, "one-shot"],
    size: [W, H], origin: [0, 0], duration, loop: false, fps: 30, bg: "sky",
    options: { color: "#0b0a10", seed: 1, ...options },
  };
}

/**
 * Where a transition is: `cin` runs 0..1 while the cover closes (0 .. a of the duration), `cout` 0..1 while it
 * opens (b .. 1), `out` says which half we're in.
 */
export function timeline(t, D, a = 0.45, b = 0.58) {
  const u = t / D;
  return { u, cin: seg(u, 0, a), cout: seg(u, b, 1), out: u >= b };
}

/** A pixel shader over the whole screen, clipped to it: fn(x, y, out) gets pixel centers (x + 0.5). */
export const screen = (p, fn) => p.shade(0, 0, W - 1, H - 1, fn);

/** The whole screen in one color. */
export const fill = (p, c) => p.rect(0, 0, W, H, c);

/** Is a point on the screen? */
export const onScreen = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

/** 4x4 Bayer thresholds 0..1 at (i, j). */
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (i, j) => (B4[((j & 3) << 2) | (i & 3)] + 0.5) / 16;

/** A line clipped to the screen (Liang-Barsky), so no pixel lands off it. */
export function clipLine(p, x0, y0, x1, y1, c) {
  const dx = x1 - x0, dy = y1 - y0, X1 = W - 0.01, Y1 = H - 0.01;
  let t0 = 0, t1 = 1;
  for (const [q, r] of [[-dx, x0 - 0.01], [dx, X1 - x0], [-dy, y0 - 0.01], [dy, Y1 - y0]]) {
    if (q === 0) {
      if (r < 0) return;
      continue;
    }
    const f = r / q;
    if (q < 0) t0 = Math.max(t0, f);
    else t1 = Math.min(t1, f);
    if (t0 > t1) return;
  }
  p.line(x0 + dx * t0, y0 + dy * t0, x0 + dx * t1, y0 + dy * t1, c);
}
